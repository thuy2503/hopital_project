import fs from 'fs';

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      filelist = walkSync(dir + '/' + file, filelist);
    } else {
      if (file.endsWith('.jsx')) {
        filelist.push(dir + '/' + file);
      }
    }
  });
  return filelist;
}

const files = walkSync('./src');
let updatedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const regex = /'http:\/\/localhost:5000\/api([^']*)'/g;
  if(regex.test(content)) {
    console.log("Updating", file);
    content = content.replace(regex, '`http://${window.location.hostname}:5000/api$1`');
    fs.writeFileSync(file, content);
    updatedCount++;
  }
});
console.log(`Updated ${updatedCount} files.`);
