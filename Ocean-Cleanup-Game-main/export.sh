rm -rf ocean-game
mkdir ocean-game
cp -r css dist pages noise img ocean-game/
cp favicon.ico index.html README.md ocean-game/
zip -r ocean-game ocean-game
rm -r ocean-game