#!/bin/sh
#
# Serve this folder via bonjour to make it easier to test
# locally on other computers (Windows, iPad, etc)
#
# Prerequisites:
#
# Setup an anonymous Apache virtual host on an unused port.
# In this script I am using port 9292
# 
# Add somthing like the following to:
#
#   file: /etc/apache2/extra/httpd-vhosts.conf
#
#   <VirtualHost *:9292>
#      ServerName avalanche
#      DocumentRoot /Users/stephen/dev/test/avalanche-js-git
#      PassengerEnabled off
#      <Directory /Users/stephen/dev/test/avalanche-js-git >
#        Options +Indexes +FollowSymLinks +MultiViews +Includes
#        AllowOverride All
#        Order allow,deny
#        Allow from all
#        DirectoryIndex avalanche2d.html
#     </Directory>
#   </VirtualHost>
#
# Add this Listen directive to get apache to listen on 9292:
#
#    file: /etc/apache2/httpd.conf
#
#    Listen 9292
#
# After starting on my compoter the page is served at this url:
#
#   http://stepheneb.local.:9292/
#

dns-sd -R "Avalanche2D" _http._tcp . 9292