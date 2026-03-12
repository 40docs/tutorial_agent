#!/bin/bash
# Reassemble index.html from source files
DIR="$(cd "$(dirname "$0")" && pwd)"

head -24 "$DIR/index.html" > /tmp/glassbox_header.txt
tail -3 "$DIR/index.html" > /tmp/glassbox_footer.txt

cat /tmp/glassbox_header.txt \
    "$DIR/src/simulation.js" \
    "$DIR/src/diagrams.js" \
    "$DIR/src/inspector.js" \
    "$DIR/src/app.js" \
    /tmp/glassbox_footer.txt > "$DIR/index.html"

echo "Assembled: $(wc -l < "$DIR/index.html") lines → $DIR/index.html"
