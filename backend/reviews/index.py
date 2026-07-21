import json
import os

import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
    'Access-Control-Max-Age': '86400',
}


def get_connection():
    dsn = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(dsn, options=f'-c search_path={schema}')
    return conn


def handler(event: dict, context) -> dict:
    '''Список и добавление отзывов клиентов о консультациях.'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    conn = get_connection()
    cur = conn.cursor()

    try:
        if method == 'GET':
            cur.execute(
                'SELECT id, name, service, text, rating, created_at FROM reviews ORDER BY created_at DESC LIMIT 100'
            )
            rows = cur.fetchall()
            reviews = [
                {
                    'id': r[0],
                    'name': r[1],
                    'service': r[2] or '',
                    'text': r[3],
                    'rating': r[4],
                    'date': r[5].strftime('%d.%m.%Y'),
                }
                for r in rows
            ]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'reviews': reviews})}

        if method == 'POST':
            try:
                body = json.loads(event.get('body') or '{}')
            except json.JSONDecodeError:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Некорректный формат запроса'})}

            name = (body.get('name') or '').strip()
            text = (body.get('text') or '').strip()
            service = (body.get('service') or '').strip()
            rating = int(body.get('rating', 5))

            if not name or not text:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите имя и текст отзыва'})}
            if rating < 1 or rating > 5:
                rating = 5

            cur.execute(
                'INSERT INTO reviews (name, service, text, rating) VALUES (%s, %s, %s, %s) RETURNING id, created_at',
                (name, service, text, rating),
            )
            new_id, created_at = cur.fetchone()
            conn.commit()

            review = {
                'id': new_id,
                'name': name,
                'service': service,
                'text': text,
                'rating': rating,
                'date': created_at.strftime('%d.%m.%Y'),
            }
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(review)}

        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Метод не поддерживается'})}
    finally:
        cur.close()
        conn.close()
