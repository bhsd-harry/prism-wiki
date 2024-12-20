#!/usr/local/bin/bash
if [[ $2 == 'npm' ]]
then
	npm publish --tag ${3-latest}
else
	sed -i '' -E "s/const version = '.+'/const version = '$1'/" src/highlight.ts
	npm run lint && npm run build
	if [[ $? -eq 0 ]]
	then
		sed -i '' -E "s/\"version\": \".+\"/\"version\": \"$1\"/" package.json
		git add -A
		git commit -m "chore: bump version to $1"
		git push
		git tag $1
		git push origin $1
	fi
fi
