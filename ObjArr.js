// global quickfunctions /////////////////////////////////////
/////////////////////////////////////////////////////
function newelm(toelm, elm, atts = []) // https://share.google/aimode/aVpham9R61TsJiguN
{
  let varn = document.createElement(elm);
  for (let att of atts) {
    let key = att[0];
    let val = att[1];
    // Controleer of de eigenschap standaard op het element bestaat
    if (key in varn) {
      varn[key] = val;
    } else {
      varn.setAttribute(key, val); // waarin key en val omgezet worden naar onderkast
    }
  }
  toelm.appendChild(varn);
  return varn; // Handig om het gemaakte element terug te geven
}


function newoption(selectelm, atts=[[]])
{
  let opt = document.createElement("OPTION");
  selectelm.appendChild(opt);
  for(let att=0; att<atts.length; att++)
  {
    opt[atts[att][0]]=atts[att][1];
  }
}

//////////////////////////////////////////////////
// BASIC OBJECT INTERACTORS
//////////////////////////////////////////////////
/*	Object.prototype.bare = function(obj){ // strip obj from standard Object properties and methods
	let Bare = Object.create(null);
	for (let [k, v] of Object.entries(obj)) { Bare[k] = v; }
	return Bare;
}
*/	
//////////////////////////////////////////////////

class NestObj
{
	constructor(object)
	{
		Object.assign(this, object);
		this.included = Object.keys(object);
		
		this.stretchedColmnNames = [];
		this.shackle = ".";
	}
	
	columnNaming(indchain = "", sCNames=[])
	{
		let indch = '';
		for( let [ind, item] of Object.entries(this))
		{
			if( this.included.includes(ind))
			{
				indch = indchain == "" ? ind : indchain + this.shackle + ind;
				if(typeof item == 'object')
				{
					item = new NestObj(item); 
					sCNames = item.columnNaming(indch, sCNames); 
				}
				else{ sCNames.push(indch)}
			}
		}
		this.stretchedColmnNames = sCNames.concat(this.stretchedColmnNames);
		return this.stretchedColmnNames;
	}
	
	columnNameInstance(stretchedColumnName = "")
	{
		let stretchedPropertiesArr = stretchedColumnName.split(this.shackle);
		let stretchedObjInstance = this;
		for(let pr=0; pr<stretchedPropertiesArr.length; pr++)
		{
			stretchedObjInstance = stretchedObjInstance[ stretchedPropertiesArr[pr] ];
//			console.log(stretchedObjInstance);
		}
		return stretchedObjInstance;
	}
	
	// for another day
	#singleton(columnName, columnValue){ return {columnName: columnValue}; }
	objectFromColumnNames( singletons=[] )
	{
		const outObj = {};
		for( let sg of singletons )
		{
			if( !(Object.keys(sg).length == 1)){ return "invalid singleton";}
			outObj[Object.keys(sg)[0]] = Object.values(sg)[0];
		}
		return outObj;
	}
}
	
class Condition
{
	constructor(columnChain, comparator = null, criterion = null)
	{ // @param columnChain like "spaces.not.allowed", // chained column names
		//        comparator mix from "!=<>",
		//        criterion like "spaces allowed around here"
		// or @param columnChain like "row[index].spaces.not.allowed !=<> spaces allowed around here"
		this.columnChain = columnChain;
		this.comparator  = comparator;
		this.criterion   = criterion;
		
		// default settings
		
		// rearrangements
		if(comparator == null && criterion == null)
		{
			this.#reconstruct();
		}
		else
		{
			this.comparator = comparator;
			this.criterion  = criterion;
		}
	}
	
	// case-insensitive substring search
	static like(haystack, needle)
	{
		// return boolean | no match returns ( -1>=0 ) == false
		return typeof needle == "string" && typeof haystack == "string" ?
		(haystack.toUpperCase().search(needle.toUpperCase()) >= 0) :
		"nostring";
	}

	// static private 'lookup table'
	static #lookUpOperator = {
	// key: function(a,b){ return boolean }
  '==':  (a, b) => a == b,
  '!=':  (a, b) => a != b,
  '===': (a, b) => a === b,
  '!==': (a, b) => a !== b,
  '<':   (a, b) => a < b,
  '>':   (a, b) => a > b,
  '<=':  (a, b) => a <= b,
  '>=':  (a, b) => a >= b,
  'LIKE':(a, b) => Condition.like(a, b)
  };
  
  static getLookUpOperator(){return Condition.#lookUpOperator;}
	
	#reconstruct()
	{
		// this.columnChain like "spaces[12].not.allowed !=<> spaces allowed around here"
		if(this.comparator == null && this.criterion == null)
		{
			// arr like: ["spaces.not.allowed", "!=<>", "spaces", "allowed", "around", "here"]
			let arr = this.columnChain.split(" ");
			
//		console.log("condition all split up"); console.log(arr);
			arr = arr.length >= 3 ?
				[arr[0], arr[1], arr.slice(2).join(" ")] :
				[];
//		console.log("condition reconstructed"); console.log(arr);
			
			if( arr.length == 3
			&& arr[0] != undefined 
			&& Object.keys(Condition.#lookUpOperator).includes(arr[1])
			&& arr[2] != undefined)
			{
				this.columnChain = arr[0];
				this.comparator  = arr[1]; 
				this.criterion   = arr[2];
			}
		}
		else{ return; }
	}
	
	test(objectRow)
	{
		// @param objectRow object to be made instance of NestObj
		// return boolean, whether that instance matches 
//		console.log("objectRow");console.log(objectRow);
	
		objectRow = (objectRow instanceof NestObj) ? objectRow : new NestObj(objectRow);
		let columnValue = objectRow.columnNameInstance(this.columnChain);
//		console.log("columnValue");console.log(columnValue);
	
//		console.log(columnValue +" "+ this.comparator +" "+ this.criterion);
		let verdict = this.comparator in 
			// if the comparator is in the keys of #lookUpOperator object
			Condition.#lookUpOperator ?
			// then check whether columnValue matches the criterion
			Condition.#lookUpOperator[this.comparator](columnValue, this.criterion.toString()) :
			// else report error
			"Error: comparator not in use.";
//		console.log([objectRow, this.comparator, this.criterion, verdict]);
		return verdict;
	}
}

class Query
{
	// (columns in rows,)
	// rows from ObjArr
	// selected by Where methods
	// fulfilling Condition conditions
	
	static fieldselect(objArr, condition)
	{
		// @param ObjArr instanceof ObjArr
		// @param condition instanceof Condition
		// return Array of indices of selected rows from ObjArr
		
		if(!(objArr instanceof ObjArr || condition instanceof Condition)){ console.log('Error: mistype'); return [];}
		
		let selectedRows = [];
		for(let inx = 0; inx<objArr.length; inx++)
		{
			if( condition.test(objArr[inx]) ){ selectedRows.push(inx); }// console.log(selectedRows);}
		}
		// console.log(selectedRows);
		return selectedRows;
	}
	
	static caseof =
	{
		'ANDin' : (a,b) => Array.from((new Set( a )).intersection(new Set( b ))),
		'ORin'  : (a,b) => Array.from((new Set( a )).union(new Set( b ))),
		'NOTin' : (a,b) => Array.from((new Set( a )).difference(new Set( b ))),
		'unique': (a,b=[]) => Array.from((new Set( a )))
	}
	
	static chaine( population =[], caseofs =[]) 
	{
	// @param caseofs ex: chaine([9,10],[['ORin',[1,2,3]], ['ORin',[4,5,6]], ['ANDin',[2,5,8]]])
		let subj = population;
		for( let ca=0; ca<caseofs.length; ca++ )
		{
		//if( Object.keys(Where.caseof).includes(caseofs[ca][0])
		//&& Array.isArray(caseofs[ca][1]) )
			if( Object.keys(Query.caseof).includes(caseofs[ca][0])
			&& Array.isArray(caseofs[ca][1]) )
			{
				subj = Query.caseof[ caseofs[ca][0] ]( subj, caseofs[ca][1] );
			} else { let msg = " fatal error; invalid query "; console.log(msg); return msg; }
		}
		return subj;
	}
	
	static sif(objarr, caseofkey, condition)
	{ // short statement for elements to chaine
		return [caseofkey, Query.fieldselect(objarr, (new Condition(condition)))];
	}
}

class ObjArr extends Array 
{
	constructor( ...args ) {
		// source: https://share.google/aimode/d9iEyH8c5xffpSQ1w
		// Controleren we of er exact 1 argument is, en of dat argument een Array is?
		// We willen 1 array omvormen naar ObjArr, dus args mag 1 element zijn van type Array
		if (args.length === 1 && Array.isArray(args[0]) && !(args[0] instanceof ObjArr)) { 
			// Ja? Dan pakken we die specifieke array uit met ...
			super(...args[0]); 
		} else {
			// Nee? (Bijv. losse argumenten of cijfers), stuur ze direct door
			super(...args);
		}
  }
  
  get stretchedColumnNames(){
  	const columns = new NestObj(this[0]);
  	return columns.stretchedColmnNames.length >0 ? columns.stretchedColmnNames : columns.columnNaming() ;
  }
  
  columnNameInstance( row, stretchedColumnName = "" ){
  	const columns = new NestObj(this[row]);
  	return columns.columnNameInstance(stretchedColumnName);
  }
	
	#whereOnly(columnChain, comparator = null, criterion = null){
		return Query.fieldselect(this, (new Condition(columnChain, comparator, criterion)));
	}
	
	#whereAll(conditions = [...[connector='',condition='']]){
		// @param conditions ex: [['ORin',"heir.birth_date > 2000"],['ANDin',"country LIKE l"]]
		let contrain = [];
		for( let ci=0; ci<conditions.length; ci++)
		{
			contrain.push([conditions[ci][0], this.#whereOnly(conditions[ci][1])]);
		}
		return Query.chaine(this.keys(),contrain);
	}
	
	where(conditions)
	{
		if(typeof conditions == "string")   { return this.#whereOnly(conditions); }
		else if( Array.isArray(conditions) ){ return this.#whereAll(conditions); }
		else return "Error: misformed conditions";
	}
	
	// CRUD - create, retrieve, update, delete /////
	CREATE(object){
		let modelRow = this[0];
		console.log(Object.keys(object));
		console.log(Object.keys(modelRow));
		return (Object.keys(object)).NOTin(Object.keys(modelRow))
//	this.push(object);
	}
	
	SELECT_keys(condition){return this.where(condition);}
	SELECT_rows(condition)
	{
		let keys = this.where(condition);
		let rows = new ObjArr([]);
		for(let keyskey=0; keyskey<keys.length; keyskey++){
		rows.push(this[keys[keyskey]]); // console.log(rows);
		}
		return rows;
	}
	
	UPDATE(){}
	
	DELETE(){}
	
	// convenience services ///////////////////////
	HTML_TABLE(indent=0)
	{
		if(this==undefined || this.length<1){return "&#8709;";}
			
		let columns= new NestObj(this[0]);
		columns.columnNaming();
		
		let indents = "\n"; for(let i=0; i<indent; i++){indents += "  ";}
		
		let html = "<table>"+indents+"<tbody>";
		
		// caption
		html += indents+"  "+"<tr>";
		for (let y of columns.stretchedColmnNames)
		{
		  html += indents+"    "+"<th> "+y+" </th>";
		}
		html += indents+"  "+"</tr>";
		
		// rows
		console.log(this)
		for(let row of this)
		{
			html += indents+"  "+"<tr>";
			let rowhere = new NestObj(row);
			for (let y of columns.stretchedColmnNames)
			{
			  html += indents+"    "+"<td> "+rowhere.columnNameInstance(y)+" </td>";
			}
			html += indents+"  "+"</tr>";
		}
		return html +indents+ "</tbody>"+indents+"</table>";
	}
		
	static #HTML_Qexec(Arr, qnr)
	{
		let SAKs = [];
		for(let qn=0; qn<=qnr; qn++)
		{
			const coupsElm  = document.getElementById('couplings'+qn); 
			const propsElm  = document.getElementById('columnames'+qn); 
			const cmpsElm   = document.getElementById('comparator'+qn);
			const cndsElm   = document.getElementById('condition'+qn);
			
			let zoekslag = 
			propsElm.options[propsElm.selectedIndex].value+' '+
			cmpsElm.options[cmpsElm.selectedIndex].value+' '+
			cndsElm.value;
			console.log(zoekslag);
			
		//console.log(Arr.SELECT_keys(zoekslag));
			
		let SAK = [ coupsElm.options[coupsElm.selectedIndex].value, zoekslag ]; 
		SAKs.push(SAK);
		}
		console.log(SAKs);
		return SAKs;
	}
	
	HTML_query_block(toelm, qnr, toid)//
	{
		newelm(toelm, 'DIV', [['id','block'+qnr]]); 
		const blockelm = document.getElementById('block'+qnr);
		
		newelm(blockelm, 'SELECT', [['id','couplings'+qnr]]);
		const couplings = ['ORin','ANDin','NOTin','unique'];//['⋃','⋂','⊅','unique']; // ['&#8899;','&#8898;','&#8837;','unique'];
		for(let opr = 0; opr<couplings.length; opr++)
		{newoption(document.getElementById('couplings'+qnr),[['label',couplings[opr] ],['value',couplings[opr] ]]);}
		
		newelm(blockelm, 'SELECT', [['id','columnames'+qnr]]);
		const columnames = (new NestObj(this[0])).columnNaming();
		for(let opr = 0; opr<columnames.length; opr++)
		{newoption(document.getElementById('columnames'+qnr),[['label',columnames[opr] ],['value',columnames[opr] ]]);}
		
		newelm(blockelm, 'SELECT', [['id','comparator'+qnr]]);
		const comparators = Object.keys(Condition.getLookUpOperator());
		for(let opr = 0; opr<comparators.length; opr++)
		{newoption(document.getElementById('comparator'+qnr),[['label',comparators[opr] ],['value',comparators[opr] ]]);}
		
		newelm(blockelm, 'INPUT', [['id','condition'+qnr],['type','text']]);
		
		newelm(blockelm, 'BUTTON', [['id','supplement'+qnr],['textContent','⏷']]); //  &#9207;
		document.getElementById('supplement'+qnr).addEventListener("click", ()=>this.HTML_query_block(toelm, qnr+1));
		
		newelm(blockelm, 'BUTTON', [['id','execute'+qnr],['textContent','⏵']]); // &#9205;
		document.getElementById('execute'+qnr).addEventListener("click", ()=> {const SAO = 
			this.SELECT_rows(ObjArr.#HTML_Qexec( this, qnr ));
			document.getElementById('selection').innerHTML = 
				"<h2>"+SAO.length+"/"+this.length+ " Selected</h2>"+
				SAO.HTML_TABLE();
			});

		for(let qn = 0; qn<qnr; qn++)
		{
			if(document.getElementById('supplement'+qn) == null){;}else{
				document.getElementById('supplement'+qn).disabled = "disabled";
				document.getElementById('execute'+qn).disabled = "disabled";
				
				if(document.getElementById('supplement'+qn).disabled){document.getElementById('supplement'+qn).remove();}
				if(document.getElementById('execute'+qn).disabled){document.getElementById('execute'+qn).remove();}
			}
		} 
	}
}
