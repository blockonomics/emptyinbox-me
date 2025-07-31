## Setup nginx
Install nginx on ubuntu if not already and enable site using nginx/emptyinbox_nginx.conf (Make sure to change root)

## Setup postfix
- sudo apt install postfix  
- It will give selection select *No configuration*
- sudo cp /usr/share/postfix/main.cf.debian /etc/postfix/main.cf
- sudo postfix/setup_postfix.sh [POSTFIX_HOSTNAME] [YOUR_DOMAIN] [YOUR_SECRET]
- You should get the followd
`postfix configured. Starting up` 

## Run gunicorn
Inside API directory create .env file with following entry
`
DOMAIN=<YOUR_DOMAIN>
SECRET=<YOUR_SECRET>`
pipenv run start
