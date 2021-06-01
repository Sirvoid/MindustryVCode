let code;
let curScope;
let readContent;
let conditionMem;
let funcCnt;

const assemble = (ast) => {

	curScope = ast[0];
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
	code.push('jump __endf_' + funcCnt + ' always');
	code.push('__' + readContent.funcName + ':');
	curScope = readContent;
};

const conditionAsm = () => {
	let type = readContent.conditionType;
	let conditionCnt = readContent.conditionCounter;
	let blockCnt = readContent.conditionBlock;
	let loopCnt = readContent.loopCounter;
	
	if(type == 'while') {
		code.push('__' + type + 's_' + loopCnt + ':');
	}
	
	if(type == 'elif') {
		code.push('jump ' + '__blockn_' +  blockCnt + ' always');
		code.push('__ifn_' + curScope.conditionCounter + ':');
	}
	
	if(type == 'else') {
		code.push('jump ' + '__blockn_' +  blockCnt + ' always');
		code.push('__' + curScope.conditionType + 'n_' + curScope.conditionCounter + ':');
	}
	
	code = code.concat(readContent.operations);
	
	code.push('jump ' + '__' + type + 'n_' + conditionCnt + ' equal __condition_result false');
	
	curScope = readContent;
};

const endAsm = () => {

	if('conditionType' in curScope) {
		let type = curScope.conditionType;
		
		if(curScope.conditionType == 'while') {
			code.push('jump ' + '__' + type + 's_' + curScope.loopCounter + ' always');
			code.push('__' + type + 'n_' + curScope.conditionCounter + ':');
		} else {
			code.push('__' + type + 'n_' + curScope.conditionCounter + ':');
			code.push('__blockn_' + curScope.conditionBlock + ':');
		}
		
	} else if('funcName' in curScope) {
		code.push(
			'__returnf_' + funcCnt + ':',
			'op sub __retCount __retCount 1',
			'read __retAddr cell1 __retCount',
			'set @counter __retAddr',
			'__endf_' + funcCnt + ':'
		);
		
		funcCnt++;
	}
	curScope = curScope.parent;
};

const breakAsm = () => {
	let type = 'while';
	code.push('jump ' + '__' + type + 'n_' + curScope.conditionCounter + ' always');
};

const continueAsm = () => {
	let type = 'while';
	code.push('jump ' + '__' + type + 's_' + curScope.loopCounter + ' always');
};

const returnAsm = () => {
	code.push('jump ' + '__returnf_' + funcCnt + ' always');
};

const cmdAsm = () => {
	code.push(readContent.command);
};

const callAsm = () => {
	code.push(
		'op add __retAddr @counter 3',
		'write __retAddr cell1 __retCount',
		'op add __retCount __retCount 1',
		'jump __' + readContent.call + ' always'
	);
};

const varAsm = () => {
	let operations = readContent.operations;
	code = code.concat(operations);
};

const tokenFunc = {
	'funcName' : funcAsm,
	'conditionType' : conditionAsm,
	'call' : callAsm,
	'varName' : varAsm,
	'command' : cmdAsm,
	'end' : endAsm,
	'break' : breakAsm,
	'continue': continueAsm,
	'return': returnAsm
};

module.exports.assemble = assemble;