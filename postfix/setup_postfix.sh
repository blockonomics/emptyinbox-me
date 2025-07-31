#!/bin/bash
set -e

SCRIPT_PATH="$(realpath "$0")"
CURRENT_DIR="$(dirname "$SCRIPT_PATH")"

if [ $# -lt 3  ]; then
    echo >&2 "Usage: ${0} POSTFIX_HOSTNAME DOMAIN SECRET "
    exit 1
fi
POSTFIX_HOSTNAME=$1
DOMAIN=$2
SECRET=$3

# Create postfix folders
mkdir -p /var/spool/postfix/
mkdir -p /var/spool/postfix/pid

# Disable SMTPUTF8, because libraries (ICU) are missing in Alpine
postconf -e "smtputf8_enable=no"

# Log to stdout
postconf -e "maillog_file=/var/log/mail.log"

# Update aliases database. It's not used, but postfix complains if the .db file is missing
postalias /etc/aliases

# Disable local mail delivery
postconf -e "mydestination=$DOMAIN"

# Limit message size to 10MB
postconf -e "message_size_limit=10240000"

# Reject invalid HELOs
postconf -e "smtpd_delay_reject=yes"
postconf -e "smtpd_helo_required=yes"
postconf -e "smtpd_helo_restrictions=permit_mynetworks,reject_invalid_helo_hostname,permit"

# Don't allow requests from outside
postconf -e "mynetworks=0.0.0.0/32"

# Set up hostname
postconf -e myhostname=$POSTFIX_HOSTNAME

# Do not relay mail from untrusted networks
postconf -e "relay_domains="

postconf -e "export_environment= SECRET=$SECRET"


# Relay configuration
#postconf -e relayhost=$POSTFIX_RELAY_HOST
#echo "$POSTFIX_RELAY_HOST $POSTFIX_RELAY_USER:$POSTFIX_RELAY_PASSWORD" >> /etc/postfix/sasl_passwd
#postmap hash:/etc/postfix/sasl_passwd
#postconf -e "smtp_sasl_auth_enable=yes"
#postconf -e "smtp_sasl_password_maps=hash:/etc/postfix/sasl_passwd"
#postconf -e "smtp_sasl_security_options=noanonymous"
#postconf -e "smtpd_recipient_restrictions=reject_non_fqdn_recipient,reject_unknown_recipient_domain"

# Use 587 (submission)
#sed -i -r -e 's/^#submission/submission/' /etc/postfix/master.cf

# Create tempmail transport transport
echo "tempmail   unix  -       n       n       -       -       pipe" >> /etc/postfix/master.cf
echo "  flags=FX user=ubuntu argv=/usr/bin/python3 ${CURRENT_DIR}"'/process_email.py ${sender} ${original_recipient}' >> /etc/postfix/master.cf

# Configure aliases
echo "postmaster: root" > /etc/aliases
echo "root: tempmail" >> /etc/aliases
newaliases
postconf -e "alias_maps=hash:/etc/aliases"
postconf -e "alias_database=hash:/etc/aliases"

# Configure virtual aliases
echo "@$DOMAIN root@$DOMAIN" > /etc/postfix/virtual_aliases
postmap /etc/postfix/virtual_aliases
postconf -e "virtual_alias_maps=hash:/etc/postfix/virtual_aliases"

# Configure transport
echo "$DOMAIN tempmail" > /etc/postfix/transport
postmap /etc/postfix/transport
postconf -e "transport_maps=hash:/etc/postfix/transport"

echo
echo 'postfix configured. Starting up'
echo

service postfix restart
