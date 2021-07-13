#!/usr/bin/env node
const fs = require('fs')
const vue_config = require('./vue.config.js')
const archiver = require('archiver')
const pJson = require('./package.json')
const chalk = require('chalk')

INFO = chalk.blue.bold("INFO")
ERROR = chalk.red.bold("ERROR")
DONE = chalk.green.bold("DONE")
console.log("%s Creating visualisation .zip file(s) ready for upload!",INFO);

if(fs.existsSync('dist/')){
    if(typeof vue_config.pages !== 'undefined'){
        
        for(let page of Object.keys(vue_config.pages)){
            if(page === 'index') continue; //Skip index page
            let output = fs.createWriteStream( page + '.zip')
            let archive = archiver('zip')

            archive.on('error',function(err){
                console.log(`%s ` + err.stack,ERROR)
                process.exit(1)
            });
            output.on('close',() =>{
                console.log(`%s File "`+page+`.zip" has been written`,INFO)
            })
            archive.pipe(output)
            process.chdir('./dist/')
            archive.glob(`**/${page}*.{css,html,js,js.map}`)
            archive.glob('**/chunk*')
            archive.glob('**/!(*.html|*.css|*.js|*.js.map)')
            archive.finalize()
            process.chdir('../')
            
        }
    }else{
        // No pages, just zip the dist folder
        const output = fs.createWriteStream(pJson.name + '.zip')
        const archive = archiver('zip')
        archive.on('error', function(err){
            throw err;
        });
        archive.pipe(output)
        archive.directory('dist/', false)
        archive.finalize()
    }
    
}else{
    console.log('%s Dir folder does not exist, did the build complete succesfully?',ERROR)
}
process.on('beforeExit',(code)=>{
    if(code === 0){
        console.log('%s Files have been created!',DONE);
    }
})
