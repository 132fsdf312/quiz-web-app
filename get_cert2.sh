#!/bin/bash
certbot --nginx -d nunt.cloud --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>&1
echo "EXIT_CODE: $?"
