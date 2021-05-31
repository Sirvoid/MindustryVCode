module.exports.parse = (tokenStr, varName) => {
	tokenStr = tokenStr.replace(/\s/g, '');

	let tokenArr = []; //token array
	let opStack = []; //operator stack
	let output = []; //output stack
	let instructions = []; //Final instructions
	let vCnt = 0; //Temp variables count

	let tokenToAdd = ''; //Current token generated
	let addToken = () => {
		tokenArr.push(tokenToAdd);
		tokenToAdd = '';
	};

	//Operators definition
	let opDef = {
		'*': { pre: 3, asc: 'left', code: 'mul'},
		'/': { pre: 3, asc: 'left', code: 'div'},
		'//': { pre: 3, asc: 'left', code: 'idiv'},
		'%': { pre: 3, asc: 'left', code: 'mod'},
		'<<': { pre: 2, asc: 'left', code: 'shl'},
		'>>': { pre: 2, asc: 'left', code: 'shr'},
		'|': { pre: 2, asc: 'left', code: 'or'},
		'^': { pre: 2, asc: 'left', code: 'xor'},
		'&': { pre: 2, asc: 'left', code: 'and'},
		'+': { pre: 2, asc: 'left', code: 'add'},
		'-': { pre: 2, asc: 'left', code: 'sub'},
		'=': { pre: 1, asc: 'left', code: 'equal'},
		'==': { pre: 1, asc: 'left', code: 'equal'},
		'!=': { pre: 1, asc: 'left', code: 'notEqual'},
		'===': { pre: 1, asc: 'left', code: 'strictEqual'},
		'<': { pre: 1, asc: 'left', code: 'lessThan'},
		'<=': { pre: 1, asc: 'left', code: 'lessThanEq'},
		'>': { pre: 1, asc: 'left', code: 'greaterThan'},
		'>=': { pre: 1, asc: 'left', code: 'greaterThanEq'},
		'&&': { pre: 1, asc: 'left', code: 'land'}
	};

	//Math functions definition
	let funcDef = {
		'sin': 1,
		'cos': 1,
		'tan': 1,
		'sqrt': 1,
		'floor': 1,
		'ceil': 1,
		'round': 1,
		'abs': 1,
		'log': 1,
		'log10': 1,
		'rand': 1,
		'max': 2,
		'min': 2,
		'noise': 2,
		'len': 2,
		'angle': 2,
		'pow': 2
	};

	//---Get tokens---
	for(let i = 0; i < tokenStr.length; i++) {
		let chara = tokenStr[i];
		let nextChar = tokenStr[i + 1];
		let prevChar = tokenStr[i - 1];

		tokenToAdd += chara;
		
		//Fix for negative numbers
		if(chara == '-' && i == 0) continue;
		if(chara == '-' && (opDef[prevChar] || prevChar == '(')) continue;
		if(nextChar == '-') {
			addToken();
			continue;
		}
		
		if(chara == '(' || chara == ')' || chara == ',' || nextChar == ',') {
			addToken();
		} else if(funcDef[tokenToAdd] && nextChar == '(') {
			addToken();
		} else if(opDef[tokenToAdd] && nextChar == '(') {
			addToken();
		} else if(opDef[nextChar] && !opDef[chara]) {
			addToken();
		} else if(opDef[chara] && !opDef[nextChar]) {
			addToken();
		} else if(nextChar == '(' || nextChar == ')') {
			addToken();
		}
		
	}

	if(tokenToAdd) addToken(); //Add remaining token


	//---Order tokens---
	for(let i = 0; i < tokenArr.length; i++) {
		let token = tokenArr[i];
		let number = parseFloat(token) || (!opDef[token] && !funcDef[token] && token != '(' && token != ')');
		
		if(token == ',') continue;
		
		let opToOutCondition = () => {
			let opOnTop = opStack[0];
			let defExist = opDef[token];
			let leftPar = opStack[0] == '(';
			if(!opOnTop || !defExist || leftPar) return false;
			let stackGreaterPre = opDef[opStack[0]].pre > opDef[token].pre;
			let stackEqualPre = opDef[opStack[0]].pre == opDef[token].pre;
			let tokenAscLeft = opDef[token].asc == 'left';
			return stackGreaterPre || ( stackEqualPre && tokenAscLeft);
		};
		
		if(opDef[token]) {
			while(opToOutCondition()) {
				output.push(opStack.shift());
			}
			opStack.unshift(token);
		} else if(number) {
			output.push(token);
		} else if(token == '(') {
			opStack.unshift(token);
		} else if(token == ')') {
			while(opStack[0] != '(') {
				output.push(opStack.shift());
			}
			if(opStack[0] == '(') {
				opStack.shift();
			} 
			if(funcDef[opStack[0]]) {
				output.push(opStack.shift());
			}
		} else {
			opStack.unshift(token);
		}
		
	}

	while(opStack[0]) {
		output.push(opStack.shift());
	}

	//---Generate instructions---
	while(output[1]) {
		for(let i = 0; i < output.length; i++) {
			let token = output[i];
			let isNumberOrVar = parseFloat(token) || (!opDef[token] && !funcDef[token] && token != '(' && token != ')');
			if(!isNumberOrVar) {
			
				let tempVar = '_TEMP_OP_' + ++vCnt;
				
				let nbParams = funcDef[token] || 2;
				let opName = opDef[token] ? opDef[token].code : token;
				
				let strOp = 'op ' + opName + ' ' + tempVar;
				
				for(let j = nbParams; j > 0; j--) {
					strOp += ' ' + output[i - j];
				}
				
				instructions.push(strOp);
				output.splice(i - nbParams, 1 + nbParams, tempVar);
				break;
			}
		}
	}

	if(instructions.length == 0) {
		instructions.push('set ' + varName + ' ' + tokenStr);
	} else {
		//Replace temp var with var assigned to
		let lastIndex = instructions.length - 1;
		instructions[lastIndex] = instructions[lastIndex].replace('_TEMP_OP_' + vCnt, varName);
	}
	
	return instructions;
};