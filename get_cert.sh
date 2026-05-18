#!/bin/bash
export PATH=$HOME/.acme.sh:$PATH
acme.sh --issue -d nunt.cloud --webroot /var/www/certbot --server zerossl 2>&1
echo "EXIT_CODE: $?"
