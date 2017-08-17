"use strict"

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const buildFilePath = 'build.json';
if (fs.existsSync(buildFilePath)) {
	fs.readFile(buildFilePath, (err, data) => {
		if (err) throw err;
		const buildConfig = JSON.parse(data.toString());
		for (const filePath in buildConfig) {
			const fileConfig = buildConfig[filePath];
			const hash = crypto.createHash('sha1');
			const input = fs.createReadStream(filePath);
			input.on('readable', () => {
				const data = input.read();
				if (data)
					hash.update(data);
				else {
					onHash(hash.digest('hex'));
				}
			});
			function onHash(latestHash) {
				let versionNumber = 1;
				if (!fileConfig.versions) {
					fileConfig.versions = [latestHash];
					fileConfig.base = 0;
				}
				else {
					versionNumber = fileConfig.versions.indexOf(latestHash) + 1;
					if (versionNumber === 0) {
						if (fileConfig.versions.length === 3) {
							fileConfig.versions.splice(0, 1);
							++fileConfig.base;
						}
						fileConfig.versions.push(latestHash);
						versionNumber = fileConfig.versions.length;
					}
					versionNumber += fileConfig.base;
				}
				fileConfig.version = versionNumber;
				const ext = path.extname(filePath);
				console.log('TODO rename', path.basename(filePath, ext) + '.' + versionNumber + ext);
			}
		}
		let exiting = false;
		process.on('beforeExit', () => {
			if (!exiting) {
				exiting = true;
				fs.writeFile(buildFilePath, JSON.stringify(buildConfig), (err) => {
					if (err) throw err;
				});
			}
		});
	})
}