import json
import os
import urllib.request
import urllib.parse

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
    'Access-Control-Max-Age': '86400',
}


def send_telegram_message(text: str):
    '''Отправляет сообщение через Telegram Bot API администратору.'''
    token = os.environ['TELEGRAM_BOT_TOKEN']
    chat_id = os.environ['TELEGRAM_CHAT_ID']
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    data = urllib.parse.urlencode({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML',
    }).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='POST')
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))


def handler(event: dict, context) -> dict:
    if (event.get('queryStringParameters') or {}).get('debug') == '1':
        token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
        url = f'https://api.telegram.org/bot{token}/getMe'
        try:
            with urllib.request.urlopen(url, timeout=10) as resp:
                me = json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            me = {'error': str(e)}
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'bot_info': me, 'configured_chat_id': chat_id, 'token_prefix': token[:10]}),
        }

    '''Отправляет уведомление в Telegram администратору о новой заявке или оплате с сайта.'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Метод не поддерживается'})}

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Некорректный формат запроса'})}

    message = (body.get('message') or '').strip()
    if not message:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пустое сообщение'})}

    try:
        send_telegram_message(message)
    except Exception as e:
        detail = str(e)
        if hasattr(e, 'read'):
            try:
                detail = e.read().decode('utf-8')
            except Exception:
                pass
        return {'statusCode': 502, 'headers': CORS_HEADERS, 'body': json.dumps({'error': f'Не удалось отправить: {detail}'})}

    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}
# refresh 1784328557
