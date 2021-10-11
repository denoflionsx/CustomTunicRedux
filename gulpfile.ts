import gulp from 'gulp';
import fs from 'fs-extra';
import child_process from 'child_process';

let MOD_NAME: string = JSON.parse(fs.readFileSync("./package.json").toString()).name;
let MOD_URL: string = "";
let MOD_DEV_URL: string = "";

gulp.task('build', function () {
    try {
        //fs.copyFileSync("./_tsconfig.json", "./tsconfig.json");
        let meta = JSON.parse(fs.readFileSync(`./src/${MOD_NAME}/package.json`).toString());
        meta.date = new Date().toUTCString();
        meta.commit = child_process.execSync("git rev-parse --short HEAD").toString().replace("\n", "");
        meta.version = meta.version.split("-")[0];
        meta.version = meta.version + `-nightly@${meta.commit}`;
        fs.writeFileSync(`./src/${MOD_NAME}/package.json`, JSON.stringify(meta, null, 2));
        child_process.execSync('npx tsc');
    } catch (err: any) {
        console.log(err.stack);
    }
    return gulp.src('./src/**/*.ts')
});

gulp.task('generate_update_file', function(){
    try {
        let meta = JSON.parse(fs.readFileSync(`./src/${MOD_NAME}/package.json`).toString());
        fs.writeFileSync("./dist/update.json", JSON.stringify({
            version: meta.version,
            url: MOD_URL,
            devUrl: MOD_DEV_URL
        }, null, 2));
    } catch (err: any) {
        console.log(err.stack);
    }
    return gulp.src('./src/**/*.ts')
});

gulp.task('remove_nightly_flag', function(){
    try {
        let meta = JSON.parse(fs.readFileSync(`./src/${MOD_NAME}/package.json`).toString());
        meta.date = "";
        meta.commit = "";
        meta.version = meta.version.split("-")[0];
        fs.writeFileSync(`./src/${MOD_NAME}/package.json`, JSON.stringify(meta, null, 2));
    } catch (err: any) {
        console.log(err.stack);
    }
    return gulp.src('./src/**/*.ts')
});

gulp.task('default', gulp.series(['remove_nightly_flag', 'build']));
