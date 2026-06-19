const XLSX = require('./client/node_modules/xlsx');
const path = require('path');

const companies = [
  { 'Company Name': 'Tampa Precision Machining',      Address: '4201 N 56th St, Tampa, FL 33610',              'Contact Name': 'Mike Russo',     Phone: '(813) 555-0142', Email: 'mrusso@tampaprecision.com' },
  { 'Company Name': 'Gulf Coast CNC Solutions',        Address: '8910 Anderson Rd, Tampa, FL 33634',            'Contact Name': 'Sandra Lee',     Phone: '(813) 555-0287', Email: 'slee@gulfcoastcnc.com' },
  { 'Company Name': 'Suncoast Machine Works',          Address: '2550 Ulmerton Rd, Clearwater, FL 33762',       'Contact Name': 'Tom Brewer',     Phone: '(727) 555-0394', Email: 'tbrewer@suncoastmachine.com' },
  { 'Company Name': 'Bay Area Tool & Die',             Address: '1830 Dr Martin Luther King Jr St N, St. Petersburg, FL 33704', 'Contact Name': 'Janet Hall', Phone: '(727) 555-0451', Email: 'jhall@bayareatool.com' },
  { 'Company Name': 'Precision Parts of Brandon',      Address: '710 Lumsden Rd, Brandon, FL 33511',            'Contact Name': 'Carlos Vega',    Phone: '(813) 555-0563', Email: 'cvega@brandonprecision.com' },
  { 'Company Name': 'Florida CNC & Automation',        Address: '5720 Gunn Hwy, Tampa, FL 33624',               'Contact Name': 'Rachel Kim',     Phone: '(813) 555-0618', Email: 'rkim@floridacnc.com' },
  { 'Company Name': 'Clearwater Metal Fabrication',    Address: '1945 Highland Ave, Clearwater, FL 33755',      'Contact Name': 'Dave Thornton',  Phone: '(727) 555-0729', Email: 'dthornton@cwmetal.com' },
  { 'Company Name': 'Sarasota CNC Center',             Address: '3421 Lakewood Ranch Blvd, Bradenton, FL 34211','Contact Name': 'Amy Sanders',    Phone: '(941) 555-0834', Email: 'asanders@sarasotacnc.com' },
  { 'Company Name': 'Lakeland Machining Co.',          Address: '2800 Hwy 98 N, Lakeland, FL 33805',            'Contact Name': 'Phil Grant',     Phone: '(863) 555-0912', Email: 'pgrant@lakelandmachine.com' },
  { 'Company Name': 'Wesley Chapel CNC Shop',          Address: '6030 Wesley Grove Blvd, Wesley Chapel, FL 33544','Contact Name': 'Laura Diaz',   Phone: '(813) 555-1043', Email: 'ldiaz@wccnc.com' },
  { 'Company Name': 'Ybor City Industrial Supply',     Address: '1901 N 22nd St, Tampa, FL 33605',              'Contact Name': 'Marco Esposito', Phone: '(813) 555-1156', Email: 'mesposito@yborsupply.com' },
  { 'Company Name': 'Plant City Precision Mfg',        Address: '1500 James L Redman Pkwy, Plant City, FL 33563','Contact Name': 'Steve Norman',  Phone: '(813) 555-1264', Email: 'snorman@plantcitymfg.com' },
  { 'Company Name': 'Apollo Beach Machining',          Address: '6429 US-41, Apollo Beach, FL 33572',           'Contact Name': 'Chris Waite',    Phone: '(813) 555-1371', Email: 'cwaite@apollomachine.com' },
  { 'Company Name': 'St. Pete Aerospace Parts',        Address: '4190 118th Ave N, Clearwater, FL 33762',       'Contact Name': 'Diane Morris',   Phone: '(727) 555-1482', Email: 'dmorris@stpeteaero.com' },
  { 'Company Name': 'Riverview CNC & Welding',         Address: '10014 Big Bend Rd, Riverview, FL 33578',       'Contact Name': 'Tony Bauer',     Phone: '(813) 555-1597', Email: 'tbauer@riverviewcnc.com' },
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(companies);

ws['!cols'] = [
  { wch: 34 },
  { wch: 52 },
  { wch: 18 },
  { wch: 16 },
  { wch: 32 },
];

XLSX.utils.book_append_sheet(wb, ws, 'Companies');
const out = path.join(__dirname, 'tampa-cnc-companies.xlsx');
XLSX.writeFile(wb, out);
console.log('Created:', out);
