const parser = require('parser');
const assembler = require('assembler');

module.exports.compile = (code) => {
	code = code.split('\n');
	let codeResult = '';
	let ast;
	let error = '';
	
	try {
		ast = parser.parse(code);
	} catch(e) {
		error =  '[ ' + parser.infos().line + ' ]:' + parser.infos().lineI;
		print('Parser error: ' + e + ' ' + error);
	}
	
	if(ast) {
		try { 
			codeResult = assembler.assemble(ast);
		} catch(e) {
			print('Assembler error: ' + e);
		}
	}
	
	return {code: codeResult, error: error};
}