import json
import os
import re
import psycopg2

from utils import hash_password, verify_password, create_token

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Authorization',
    'Access-Control-Max-Age': '86400',
}


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


def handler(event: dict, context) -> dict:
    '''Регистрация и вход в личный кабинет клиента по телефону+паролю или email+паролю.'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Метод не поддерживается'}),
        }

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Некорректный формат запроса'}),
        }

    action = body.get('action')
    login_type = body.get('login_type', 'phone')
    password = (body.get('password') or '').strip()
    name = (body.get('name') or '').strip() or None

    phone = normalize_phone(body.get('phone', '')) if login_type == 'phone' else None
    email = (body.get('email') or '').strip().lower() if login_type == 'email' else None

    if action not in ('register', 'login'):
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Неизвестное действие'}),
        }

    if login_type == 'phone' and not phone:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите телефон'})}
    if login_type == 'email' and not email:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите email'})}
    if not password or len(password) < 4:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пароль минимум 4 символа'})}

    secret = os.environ['JWT_SECRET_KEY']
    conn = get_connection()
    cur = conn.cursor()

    try:
        if action == 'register':
            if login_type == 'phone':
                cur.execute('SELECT id FROM users WHERE phone = %s', (phone,))
            else:
                cur.execute('SELECT id FROM users WHERE email = %s', (email,))
            existing = cur.fetchone()
            if existing:
                return {
                    'statusCode': 409,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': 'Аккаунт уже существует, войдите'}),
                }

            pwd_hash = hash_password(password)
            cur.execute(
                'INSERT INTO users (phone, email, password_hash, name, stars) VALUES (%s, %s, %s, %s, 0) RETURNING id, stars',
                (phone, email, pwd_hash, name),
            )
            user_id, stars = cur.fetchone()
            conn.commit()

            token = create_token(user_id, secret)
            return {
                'statusCode': 201,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'token': token,
                    'user': {'id': user_id, 'name': name, 'phone': phone, 'email': email, 'stars': stars},
                }),
            }

        else:
            if login_type == 'phone':
                cur.execute('SELECT id, password_hash, name, phone, email, stars FROM users WHERE phone = %s', (phone,))
            else:
                cur.execute('SELECT id, password_hash, name, phone, email, stars FROM users WHERE email = %s', (email,))
            row = cur.fetchone()

            if not row or not verify_password(password, row[1]):
                return {
                    'statusCode': 401,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': 'Неверные данные для входа'}),
                }

            user_id, _, u_name, u_phone, u_email, stars = row
            token = create_token(user_id, secret)
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'token': token,
                    'user': {'id': user_id, 'name': u_name, 'phone': u_phone, 'email': u_email, 'stars': stars},
                }),
            }
    finally:
        cur.close()
        conn.close()
# v2
# v3 1784324744
