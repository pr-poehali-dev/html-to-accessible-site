import json
import os
import re

import psycopg2

from utils import verify_token

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Authorization, X-Admin-Password',
    'Access-Control-Max-Age': '86400',
}

STARS_FOR_FREE_VISIT = 5


def get_connection():
    dsn = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(dsn, options=f'-c search_path={schema}')
    return conn


def normalize_phone(phone: str) -> str:
    digits = re.sub(r'\D', '', phone or '')
    if len(digits) == 11 and digits.startswith('8'):
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return digits


def get_user_id_from_token(event: dict):
    headers = event.get('headers') or {}
    auth_header = headers.get('X-Authorization') or headers.get('x-authorization') or ''
    token = auth_header.replace('Bearer ', '').strip()
    if not token:
        return None
    secret = os.environ['JWT_SECRET_KEY']
    return verify_token(token, secret)


def profile_response(cur, user_id):
    cur.execute('SELECT id, name, phone, email, stars FROM users WHERE id = %s', (user_id,))
    row = cur.fetchone()
    if not row:
        return None
    uid, name, phone, email, stars = row
    free_visits = stars // STARS_FOR_FREE_VISIT
    progress = stars % STARS_FOR_FREE_VISIT
    return {
        'id': uid,
        'name': name,
        'phone': phone,
        'email': email,
        'stars': stars,
        'stars_target': STARS_FOR_FREE_VISIT,
        'progress': progress,
        'free_visits_available': free_visits,
    }


def handler(event: dict, context) -> dict:
    '''Профиль клиента со звёздами лояльности и админское начисление звёзд.'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action') if method == 'GET' else None

    conn = get_connection()
    cur = conn.cursor()

    try:
        if method == 'GET' and action == 'profile':
            user_id = get_user_id_from_token(event)
            if not user_id:
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Требуется авторизация'})}
            profile = profile_response(cur, user_id)
            if not profile:
                return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пользователь не найден'})}
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(profile)}

        if method == 'POST':
            try:
                body = json.loads(event.get('body') or '{}')
            except json.JSONDecodeError:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Некорректный формат запроса'})}

            post_action = body.get('action')

            if post_action == 'add_star_self':
                user_id = get_user_id_from_token(event)
                if not user_id:
                    return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Требуется авторизация'})}
                cur.execute('UPDATE users SET stars = stars + 1 WHERE id = %s RETURNING stars', (user_id,))
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пользователь не найден'})}
                cur.execute(
                    'INSERT INTO star_events (user_id, change, reason) VALUES (%s, 1, %s)',
                    (user_id, body.get('reason', 'Оплата на сайте')),
                )
                conn.commit()
                profile = profile_response(cur, user_id)
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(profile)}

            if post_action == 'admin_find':
                headers = event.get('headers') or {}
                admin_pwd = headers.get('X-Admin-Password') or headers.get('x-admin-password')
                if admin_pwd != os.environ.get('ADMIN_PASSWORD'):
                    return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный пароль администратора'})}

                query = (body.get('query') or '').strip()
                phone_query = normalize_phone(query)
                cur.execute(
                    '''SELECT id, name, phone, email, stars FROM users
                       WHERE phone LIKE %s OR LOWER(COALESCE(name, '')) LIKE %s OR LOWER(COALESCE(email,'')) LIKE %s
                       ORDER BY id DESC LIMIT 20''',
                    (f'%{phone_query}%', f'%{query.lower()}%', f'%{query.lower()}%'),
                )
                rows = cur.fetchall()
                results = [
                    {'id': r[0], 'name': r[1], 'phone': r[2], 'email': r[3], 'stars': r[4]}
                    for r in rows
                ]
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'results': results})}

            if post_action == 'admin_add_star':
                headers = event.get('headers') or {}
                admin_pwd = headers.get('X-Admin-Password') or headers.get('x-admin-password')
                if admin_pwd != os.environ.get('ADMIN_PASSWORD'):
                    return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный пароль администратора'})}

                target_id = body.get('user_id')
                delta = int(body.get('delta', 1))
                if not target_id:
                    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не указан клиент'})}

                cur.execute('UPDATE users SET stars = GREATEST(stars + %s, 0) WHERE id = %s RETURNING id, name, phone, email, stars', (delta, target_id))
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Клиент не найден'})}
                cur.execute(
                    'INSERT INTO star_events (user_id, change, reason) VALUES (%s, %s, %s)',
                    (target_id, delta, body.get('reason', 'Ручное начисление администратором')),
                )
                conn.commit()
                uid, name, phone, email, stars = row
                return {
                    'statusCode': 200,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'id': uid, 'name': name, 'phone': phone, 'email': email, 'stars': stars}),
                }

            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неизвестное действие'})}

        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Некорректный запрос'})}
    finally:
        cur.close()
        conn.close()
# v2
# v3 1784324744
