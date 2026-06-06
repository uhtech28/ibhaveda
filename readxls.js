const xlsx = require('./node_modules/xlsx');

function dump(path) {
  const wb = xlsx.readFile(path);
  const fname = path.replace(/.*[\/\\]/, '');
  console.log('\n===== ' + fname + ' =====');
  wb.SheetNames.forEach(function(name) {
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[name], { defval: '' });
    console.log('\n--- ' + name + ' (' + rows.length + ' rows) ---');
    rows.forEach(function(r) { console.log(JSON.stringify(r)); });
  });
}

dump('C:/Users/aryan/Desktop/Ibhaveda/Structure/monsters_and_mechanics.xlsx');
dump('C:/Users/aryan/Desktop/Ibhaveda/Structure/checkpoint_tasks_v3.xlsx');
