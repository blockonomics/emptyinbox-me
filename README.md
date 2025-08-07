## Setup nginx
Install nginx on ubuntu if not already and enable site using nginx/emptyinbox_nginx.conf (Make sure to change root)

## Setup postfix
- sudo apt install postfix  
- It will give selection select *No configuration*
- `sudo cp /usr/share/postfix/main.cf.debian /etc/postfix/main.cf`
- `sudo postfix/setup_postfix.sh [POSTFIX_HOSTNAME] [YOUR_DOMAIN] [YOUR_SECRET]`
- You should get the following message  
*postfix configured. Starting up*

## Run gunicorn
Inside API directory create .env file with following entry    
`
DOMAIN=<YOUR_DOMAIN>
SECRET=<YOUR_SECRET>
FLASK_ENV=<development|production>
BLOCKONOMICS_API_KEY=<YOUR_BLOCKONOMICS_API_KEY>
USDT_RECEIVING_ADDRESS=<YOUR_USDT_RECEIVING_ADDRESS>
MATCH_CALLBACK=<YOUR_MATCH_CALLBACK>
`
- First setup python packages using `pipenv install`
- Setup db_model `pipenv run create_db` 
- Run server using `pipenv run start`

## Sample Run
`
curl -d'{}' -H "Authorization:Bearer btc" http://emptyinbox.me/api/inbox
creepy.tiny.advice@emptyinbox.me
`
  
`
curl  -H "Authorization:Bearer btc" http://emptyinbox.me/api/inboxes
[
  "creepy.tiny.advice@emptyinbox.me"
]
`
  
`
curl  -H "Authorization:Bearer btc" http://emptyinbox.me/api/messages
[
  {
    "id": "f3d6dfd6",
    "inbox": "creepy.tiny.advice@emptyinbox.me"
  },
  {
    "id": "0e3ffc23",
    "inbox": "creepy.tiny.advice@emptyinbox.me"
  }
]
`
  
`
curl  -H "Authorization:Bearer btc" http://emptyinbox.me/api/message/0e3ffc23
{"sender": "ubuntu@emptyinbox.me", "recipients": ["creepy.tiny.advice@emptyinbox.me"], "headers": {"Received": "by emptyinbox.me (Postfix, from userid 1000)\tid 9687540509; Mon,  4 Aug 2025 04:44:35 +0000 (UTC)", "Subject": "hello", "Message-Id": "<20250804044435.9687540509@emptyinbox.me>", "Date": "Mon, 04 Aug 2025 04:44:35 +0000", "From": "Ubuntu <ubuntu@emptyinbox.me>"}, "body": "Received: by emptyinbox.me (Postfix, from userid 1000)\r\n\tid 9687540509; Mon,  4 Aug 2025 04:44:35 +0000 (UTC)\r\nSubject: hello\r\nMessage-Id: <20250804044435.9687540509@emptyinbox.me>\r\nDate: Mon,  4 Aug 2025 04:44:35 +0000 (UTC)\r\nFrom: Ubuntu <ubuntu@emptyinbox.me>\r\n\r\n"}
`
