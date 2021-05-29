let code;
let curScope;
let readContent;
let conditionMem;
let conditionCnt;
let funcCnt;

const assemble = (ast) => {

	curScope = ast[0];
	conditionMem = {'if':[],'while':[]};
	conditionCnt = 0;
	funcCnt = 0;
	code = [];
	
	do {
	
		curScope.i++;
		for(let token in tokenFunc) {
			readContent = curScope.content[curScope.i];
			if(curScope.i >= curScope.content.length) break;
			if(token in readContent) {
				tokenFunc[token]();
				break;
			}
		}
		
		if(curScope.i >= curScope.content.length) break;
	} while(true)
	
	code.push('end');
	return code.join('\n');
};

const funcAsm = () => {
	code.push('jump _ENDF_' + funcCnt + ' always');
	code.push(readContent.funcName + ':');
	curScope = readContent;
};

const conditionAsm = () => {
	let type = readContent.conditionType;
	let conMem = conditionMem[type];
	
	conMem.push(++conditionCnt);
	let typeUpper = type.toUpperCase();
	
	code.push(
		'_' + typeUpper + 'S_' + conditionCnt + ':',
		'jump ' + '_' + typeUpper + '_' + conditionCnt + ' ' + readContent.condition[0] + ' ' + readContent.condition[1] + ' ' + readContent.condition[2],
		'jump ' + '_' + typeUpper + 'N_' + conditionCnt + ' always',
		'_' + typeUpper + '_' + conditionCnt + ':'
	);
	
	curScope = readContent;
};

const endAsm = () => {

	if('conditionType' in curScope) {
		let type = curScope.conditionType;
		let typeUpper = type.toUpperCase();
		
		let conMem = conditionMem[type];
		
		let conditionCode = conMem[conMem.length - 1];
		conMem.splice(conMem.length - 1, 1);
		
		if(curScope.conditionType == 'while') {
			code.push('jump ' + '_' + typeUpper + 'S_' + conditionCode + ' always');
		}
		
		code.push('_' + typeUpper + 'N_' + conditionCode + ':');
	} else if('funcName' in curScope) {
		code.push(
			'op sub _retCount _retCount 1',
			'read _retAddr cell1 _retCount',
			'set @counter _retAddr',
			'_ENDF_' + funcCnt++ + ':'
		);
	}
	curScope = curScope.parent;
};

const breakAsm = () => {
	let type = 'while';
	let typeUpper = type.toUpperCase();
	let conMem = conditionMem[type];
	let conditionCode = conMem[conMem.length - 1];
	code.push('jump ' + '_' + typeUpper + 'N_' + conditionCode + ' always');
};

const cmdAsm = () => {
	code.push(readContent.command);
};

const callAsm = () => {
	code.push(
		'op add _retAddr @counter 3',
		'write _retAddr cell1 _retCount',
		'op add _retCount _retCount 1',
		'jump ' + readContent.call + ' always'
	);
};

const varAsm = () => {
	let operation = readContent.operation;
	code.push(
		operation[0] + ' ' + readContent.varName + ' ' + operation[1] + (operation[2] ? ' ' + operation[2] : '')
	);
};

const tokenFunc = {
	'funcName' : funcAsm,
	'condition' : conditionAsm,
	'call' : callAsm,
	'varName' : varAsm,
	'command' : cmdAsm,
	'end' : endAsm,
	'break' : breakAsm
};

module.exports.assemble = assemble;