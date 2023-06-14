rm -rf ~/prod-old
mv ~/prod ~/prod-old
meteor build ~/prod/ --directory --server=https://darktotal.com --architecture os.linux.x86_64 --server-only --verbose
cd ~/prod/bundle/programs/server
npm install
cd ~/darktotal.com