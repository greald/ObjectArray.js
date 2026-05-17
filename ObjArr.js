	// BASIC SET INTERACTORS supplementing omitted Array-methods 
	//////////////////////////////////////////////////
	Array.prototype.intersecting = function(arr2){
		// source: https://stackoverflow.com/a/1885569
		return this.filter(value => arr2.includes(value));
		
		// redundant, source: GHv 20250322
		let ints = [];
		for( let a1 of this ){ if( arr2.includes(a1) ){ ints.push(a1); };}
		return ints;
	}

	Array.prototype.unique = function(){
		return this.from(new Set(this));
		// want O(1) is sneller dan O(n)
		let uniq = [];
	  for(let a of this){if(! uniq.includes(a)){uniq.push(a)};}
	  return uniq;
	}

	Array.prototype.unifying = function(arr2){ return this.concat(arr2).unique(); }

	Array.prototype.excluding = function(arr2){
		let excl = [];
	  for(let a of this){if(! arr2.includes(a)){excl.push(a)};}
	  return excl;
	}
	
	// popularised set interactors
	Array.prototype.ANDin = function(arr2){return this.intersecting(arr2);}
	Array.prototype.ORin  = function(arr2){return this.unifying(arr2);}
	Array.prototype.NOTin = function(arr2){return this.excluding(arr2);}
	
	//////////////////////////////////////////////////
	// BASIC OBJECT INTERACTORS
	//////////////////////////////////////////////////
	Object.prototype.bare = function(obj){ // strip obj from standard Object properties and methods
		let Bare = Object.create(null);
		for (let [k, v] of Object.entries(obj)) { Bare[k] = v; }
		return Bare;
	}
	
	//////////////////////////////////////////////////
	
	class Condition
	{
		constructor(premisse, comparator = null, criterion = null)
		{ // @param premisse like "spaces[12].not.allowed", comparator mix from "!=<>", criterion like "spaces allowed around here"
			// or @param premisse like "spaces[12].not.allowed !=<> spaces allowed around here"
			this.premisse = premisse;
			this.comparator = comparator;
			this.criterion = criterion;
			
			// default settings
			this.predicate = false;			
			this.subject = Object.bare({});
			this.tailchain = []; // subject's chained property names
			
			// rearrangements
			if(comparator == null && criterion == null){
				this.#reconstruct();}else{
				this.comparator = comparator;
				this.criterion = criterion;
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
	  
	  getLookUpOperator(){return Condition.#lookUpOperator;}
		
		#reconstruct(){
			// this.premisse like "spaces.not.allowed !=<> spaces allowed around here"
			if(this.comparator == null && this.criterion == null)
			{
				
				let arr = this.premisse.split(" ");
	//		console.log("condition all split up"); console.log(arr);
				arr = arr.length >= 3 ? [arr[0], arr[1], arr.slice(2).join(" ")] : [];
	//		console.log("condition reconstructed"); console.log(arr);
				
				if( arr.length == 3
				&& arr[0] != undefined 
				&& Object.keys(Condition.#lookUpOperator).includes(arr[1])
				&& arr[2] != undefined)
				{
					this.tailchain  = arr[0].split("."); 
					this.comparator = arr[1]; 
					this.criterion  = arr[2];
				}
			}
			else{ return; }
		}
		
		test(testsubject){
//		console.log (this.tailchain);
			for(let ch=0; ch<this.tailchain.length; ch++)
				{
//				console.log (this.tailchain[ch]);
					testsubject = testsubject[this.tailchain[ch]];
//				console.log (testsubject);
				}
//		console.log(testsubject+" "+this.comparator+" "+this.criterion);
			let verdict = this.comparator in 
				// if the comparator is in the keys of #lookUpOperator object
				Condition.#lookUpOperator ?
				// then check whether edgehere matches the criterion
				Condition.#lookUpOperator[this.comparator](testsubject, this.criterion.toString()) :
				// else report error
				"Error: comparator not in use.";
  		console.log(testsubject+" "+this.comparator+" "+this.criterion+" is "+verdict);
			return verdict;
		}
	}
	
	class ObjArr extends Array 
	{
		constructor( ...args ) {
		// source: https://share.google/aimode/d9iEyH8c5xffpSQ1w
    // Controleren we of er exact 1 argument is, en of dat argument een Array is?
    if (args.length === 1 && Array.isArray(args[0]) && !(args[0] instanceof ObjArr)) {
      // Ja? Dan pakken we die specifieke array uit met ...
      super(...args[0]); 
    } else {
      // Nee? (Bijv. losse argumenten of cijfers), stuur ze direct door
      super(...args);
    }
    
    this.Objrows = this;
  }
		
		where(condition, comparator = null, criterion = null)
		{
			if( !(condition instanceof Condition) ){ condition = new Condition(condition, comparator, criterion)};
//		console.log(condition);
			
			let matchindices=[];
			for(let i=0; i<this.length; i++)
			{
//			console.log("row");console.log(this[i]);
				if(condition.test(this[i]))
				{
					matchindices.push(i); 
				}
//			console.log("matches");console.log(matchindices);
			}
			return matchindices;
		}
		
		// CRUD - create, retrieve, update, delete
		
		CREATE(object){this.push(object);}
		
		SELECT_keys(condition){return this.WHERE(condition);}
		SELECT_rows(condition)
		{
			let keys = this.WHERE(condition);
			let rows = [];
			for(let keyskey=0; keyskey<keys.length; keyskey++){
  			rows.push(this.Objrows[keys[keyskey]]);
			}
			return rows;
		}
		
		UPDATE(){}
		
		DELETE(){}
		
		// convenience service
		ObjStretchArr()
		{
  		let ObjArr = this;
			let stretchedObjArr = [];
  		for(let o=0; o<ObjArr.length; o++)
			{
  			ObjArr[o] = new NestObj(ObjArr[o]);
  			stretchedObjArr.push( ObjArr[o].stretch() );
			}
			return stretchedObjArr;
		}
	}
	
	class NestObj extends Object 
	{
		constructor(nest, ...args)
		{
			super(...args); 
			this.nest = nest;
		}
		
	//	stretch = function( indchain = "", stretchedObj={} )
		stretch( indchain = "", stretchedObj={} )
		{
			for( let [ind, item] of Object.entries(this.nest))
			{
				let indch = indchain == "" ? ind : indchain+"."+ind;
//  		console.log([ indch, item, typeof item]);
				if( typeof item == 'object')
				{
				 item = new NestObj(item);
				 stretchedObj = item.stretch( indch, stretchedObj );
				}
				else { stretchedObj[indch] = item; }
	//		console.log(stretchedObj);
			}
			return stretchedObj;
		}
	}
	
	// HTML
		
	Array.prototype.HTML_TABLE = function(indent=0)
	{
		let indents = "\n"; for(let i=0; i<indent; i++){indents += "  ";}
		
		let html = "<table>"+indents+"<tbody>";
		// caption
		html += indents+"  "+"<tr>";
		for (let [indx, value] of Object.entries(this[0]))
		{
		  html += indents+"    "+"<th> "+indx+" </th>";
		}
		html += indents+"  "+"</tr>";
		
		// rows
		for(row = 0; row < this.length; row++)
		{
			html += indents+"  "+"<tr>";
			for (let [indx, value] of Object.entries(this[row]))
			{
			  html += indents+"    "+"<td> "+value+" </td>";
			}
			html += indents+"  "+"</tr>";
		}
		return html +indents+ "</tbody>"+indents+"</table>";
	}
