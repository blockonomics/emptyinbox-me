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
SECRET=<YOUR_SECRET>`
- First setup python packages using `pipenv install`
- Run server using `pipenv run start`

## Testing

### Create inbox
`curl -d'{}' http://emptyinbox.me/api/mailbox
{"mailbox":"busy.clean.kiss@emptyinbox.me","token":"f5506d12-1ab1-484f-8b77-7829e26c248e"}`
`
### Send email to inbox
`echo "Subject: hello" | sendmail "busy.clean.kiss@emptyinbox.me"`

### Check inbox contents via token
`curl http://emptyinbox.me/api/f5506d12-1ab1-484f-8b77-7829e26c248e
{"emails":[{"body":"Received: by emptyinbox.me (Postfix, from userid 1000)\r\n\tid B2F6340498; Thu, 31 Jul 2025 05:59:39 +0000 (UTC)\r\nSubject: hello\r\nMessage-Id: <20250731055939.B2F6340498@emptyinbox.me>\r\nDate: Thu, 31 Jul 2025 05:59:39 +0000 (UTC)\r\nFrom: Ubuntu <ubuntu@emptyinbox.me>\r\n\r\n","headers":{"Date":"Thu, 31 Jul 2025 05:59:39 +0000","From":"Ubuntu <ubuntu@emptyinbox.me>","Message-Id":"<20250731055939.B2F6340498@emptyinbox.me>","Received":"by emptyinbox.me (Postfix, from userid 1000)\tid B2F6340498; Thu, 31 Jul 2025 05:59:39 +0000 (UTC)","Subject":"hello"},"recipients":["busy.clean.kiss@emptyinbox.me"],"sender":"ubuntu@emptyinbox.me"}],"mailbox":"busy.clean.kiss@emptyinbox.me"}
`
