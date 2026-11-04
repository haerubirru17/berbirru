# cek endpoint pasar yang tersedia dulu
curl -s "https://berbirru-uji.haerubirru17.workers.dev/api/listings?limit=3" | head -c 400; echo
curl -s "https://berbirru-uji.haerubirru17.workers.dev/api/posts?mode=sosial" | python3 -c "import sys,json;d=json.load(sys.stdin);print([p['pen_name'] for p in d['posts']])"