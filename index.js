const fs = require('fs');
const moment = require('moment');

const content = fs.readFileSync('markers.csv', {
	encoding: 'ucs2',
});

fs.writeFileSync('markers_utf8.csv', content, {
	encoding: 'utf8',
});

console.log('\n\nPROCESS', process.argv);

const timeFromARGV = process.argv[2];
const hasTimeStart = !!timeFromARGV;
const TIME_START = hasTimeStart ? timeFromARGV.split('.').join(';') : null;

const TAB_SYMBOL = '\t';
const DEFAULT_TYPE = 'Cue';
const DEFAULT_TIME_FORMAT = '59.94 fps drop';

// ---

// premiere => ['Имя маркера', 'Описание', 'Вход', 'Выход', 'Длительность', 'Тип маркера'];
const auditionHeaders = 'Name\tStart\tDuration\tTime format\tType\tDescription\n';

fs.readFile('markers_utf8.csv', 'utf8', (err, data) => {
	if (err) {
		console.log('ERROR:', err);
		return;
	}

	console.log('\nСоздание временного файла...\n');

	const splittedData = data.split('\n');
	const premiereHeaders = splittedData[0];

	const dataWithoutHeaders = splittedData.slice(1, splittedData.length - 1);

	const updatedData = dataWithoutHeaders.reduce((acc, row, index) => {
		const splittedRow = row.split('\t');

		let startDate = splittedRow[2];

		if (TIME_START !== null) {
			startDate = moment.utc(
				moment(splittedRow[2],'HH;mm;ss;SS').diff(
					moment(TIME_START,'HH;mm;ss;SS')
				)
			).format('HH:mm:ss:SS');

			if (startDate === 'Invalid date') {
				console.log('ERROR: Invalid date');

				return acc;
			}
		}

		acc +=
			(splittedRow[0] || `Marker ${index}`) + TAB_SYMBOL +
			startDate + TAB_SYMBOL +
			splittedRow[4] + TAB_SYMBOL +
			DEFAULT_TIME_FORMAT + TAB_SYMBOL +
			DEFAULT_TYPE + TAB_SYMBOL +
			splittedRow[1] + '\n';

		return acc;
	}, '');

	const updatedDataWithHeaders = auditionHeaders + updatedData;

	console.log(updatedDataWithHeaders);

	console.log('\nСоздание: markers_audition.csv\n');

	fs.writeFile('markers_audition.csv', updatedDataWithHeaders, (err, data) => {
		if (err) {
			console.log('ERROR:', err);
			return;
		}

		console.log('markers_audition.csv Успешно создан.');
		console.log('Удаление временного файла...');

		fs.unlink('markers_utf8.csv', (err) => {
			if (err) {
				console.log('ERROR:', err);
				return;
			}

			console.log('Временный файл удален...');
			console.log('\nГотово.');
		});
	});
});