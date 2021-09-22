

"use strict";

const Path = require('path');
const File = require('fs');
const FileExt = require('fs-extra')
const Axios = require('axios')
const Process = require('process')
const Compress = require('compressing');

const GRPC_WEB_SUFFIX = {'darwin-x64': 'darwin-x86_64',
						'linux-x64': 'linux-x86_64',
						'windows-x64': 'windows-x86_64'};
const PROTOC_SUFFIX = {'darwin-x64': 'osx-x86_64',
							'linux-x64': 'linux-x86_64',
							'windows-x64': 'win64'};

const TEMP_DIR = Path.join(process.cwd(), './temp')

async function createPackage(grpcWebVer, protocVer, pkgName, exeExt, outPath) {
	console.log(`create pkg ${pkgName}`)
	const tempPath = Path.join(TEMP_DIR, pkgName)

	const grpcWebSuffix = GRPC_WEB_SUFFIX[pkgName];
	const grpcWebUrl = `https://hub.fastgit.org/grpc/grpc-web/releases/download/${grpcWebVer}/protoc-gen-grpc-web-${grpcWebVer}-${grpcWebSuffix}${exeExt}`;
	const grpcWebBin = Path.join(tempPath, 'grpcWeb', `grpc_web_plugin${exeExt}`)
	await downloadFile(grpcWebUrl, grpcWebBin)
	File.chmodSync(grpcWebBin, 0o777)


	const protocSuffix = PROTOC_SUFFIX[pkgName]
	const protocUrl = `https://hub.fastgit.org/protocolbuffers/protobuf/releases/download/v${protocVer}/protoc-${protocVer}-${protocSuffix}.zip`
	const protocPkg = Path.join(tempPath, 'protoc', 'pkg.zip')	
	await downloadFile(protocUrl, protocPkg)

	const protocPkgData = Path.join(tempPath, 'protoc', 'pkg')
	await Compress.zip.uncompress(protocPkg, protocPkgData)

	const protocBin = Path.join(protocPkgData, 'bin', `protoc${exeExt}`)
	File.chmodSync(protocBin, 0o777)	

	const outStream = new Compress.tar.Stream()
	outStream.addEntry(grpcWebBin, {relativePath: `bin/grpc_web_plugin${exeExt}`})
	outStream.addEntry(protocBin, {relativePath: `bin/protoc${exeExt}`})
	outStream.addEntry(Path.join(protocPkgData, 'include'), {ignoreBase: true, relativePath: 'bin/'})
	await Compress.gzip.compressFile(outStream, Path.join(outPath, `${pkgName}.tar.gz`))
}


async function downloadFile(url, filePath) {
	FileExt.ensureDirSync(Path.dirname(filePath));
	const writer = File.createWriteStream(filePath);
	const resp = await Axios.get(url, {responseType: "stream"});
	resp.data.pipe(writer);
	return new Promise((resolve, reject) => {
		writer.on("finish", resolve);
        writer.on("error", reject);
	})
}

const GRPC_WEB_VER = '1.2.1'
const PROTOC_VER = '3.15.0'

async function create() {
	const stageDir = Path.resolve(process.cwd(), './build/stage')
	const metaData = JSON.parse(
		await File.promises.readFile(
			Path.resolve(process.cwd(), './package.json')))

	const outPath = Path.join(stageDir, metaData.version)

	FileExt.emptyDirSync(TEMP_DIR)
	FileExt.emptyDirSync(outPath)

	await createPackage(GRPC_WEB_VER, PROTOC_VER, 'darwin-x64', '', outPath)
	await createPackage(GRPC_WEB_VER, PROTOC_VER, 'linux-x64', '', outPath)
	await createPackage(GRPC_WEB_VER, PROTOC_VER, 'windows-x64', '.exe', outPath)
		
	console.log('create is done')
	Process.exit(0)
}






create()











