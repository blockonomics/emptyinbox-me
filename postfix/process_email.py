#! /usr/bin/python3

import os
import sys
import json
import requests
import base64
from email.parser import Parser
from email import policy

email = Parser(policy=policy.SMTP).parse(sys.stdin)


secret = os.getenv('SECRET')
headers = {
    'User-Agent': 'tempmail/service',
    'Authorization': f'Bearer {secret}'
}

data = {
    'sender':sys.argv[1],
    'recipients' : sys.argv[2:],
    'headers': { k:v  for k,v in email.items()},

    }
if email.get_body(('plain',)):
    data['text_body'] = email.get_body(('plain',)).get_content()

if email.get_body(('html',)):
    data['html_body'] = email.get_body(('html',)).get_content()

requests.post(f'http://localhost/api/email', json=data, headers=headers)
