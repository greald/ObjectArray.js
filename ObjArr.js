	// BASIC SET INTERACTORS supplementing Array-methods 
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
	
	Array.prototype.ANDin = function(arr2){return this.intersecting(arr2);}
	Array.prototype.ORin  = function(arr2){return this.unifying(arr2);}
	Array.prototype.NOTin = function(arr2){return this.excluding(arr2);}
	
	Array.prototype.WHERE = function(condition){
		// return array of keys of Array that match condition
		// @param condition: string: chained.properties +" "+ comparator +" "+criterion
		
		let comparators = [ "==", "!=", "===", "!==", "<", ">", ">=", "<=" ];
		let matchindices = [];
		
		let arr = condition.split(" ");
		if( arr.length == 3
		&& arr[0] != undefined 
		&& comparators.includes(arr[1])
		&& arr[2] != undefined)
		{
			// redefine condition
			condition = {chainstr: arr[0], comparator: arr[1], criterion: arr[2]}; // console.log("condition");console.log(condition);
			let chain = condition.chainstr.split("."); // console.log("chain");console.log(chain);
			// reconstruct condition s and check them
			for(let i=0; i<this.length; i++)
			{
				// reconstruct subject to be checked
				let edgehere = this[i];
				for(let ch=0; ch<chain.length; ch++)
				{
					edgehere = edgehere[chain[ch]];
				} // console.log("chainedge");console.log(edgehere);
				
				// check 
				if(condition.comparator == "=="  && edgehere ==  condition.criterion){ matchindices.push(i); } else
				if(condition.comparator == "!="  && edgehere !=  condition.criterion){ matchindices.push(i); } else
				if(condition.comparator == "===" && edgehere === condition.criterion){ matchindices.push(i); } else
				if(condition.comparator == "!==" && edgehere !== condition.criterion){ matchindices.push(i); } else
				if(condition.comparator == "<"   && edgehere <    condition.criterion){ matchindices.push(i); } else
				if(condition.comparator == ">"   && edgehere >    condition.criterion){ matchindices.push(i); } else
				if(condition.comparator == ">="  && edgehere >=   condition.criterion){ matchindices.push(i); } else
				if(condition.comparator == "<="  && edgehere <=   condition.criterion){ matchindices.push(i); }
			}
			return matchindices;
		}
		else
		{return "invalid condition";}
		
	}
	
	// CRUD - create, retrieve, update, delete
	Array.prototype.CREATE = function(object){this.push(object);}
	
	Array.prototype.SELECT_keys = function(condition){return this.WHERE(condition);}
	Array.prototype.SELECT_rows = function(condition){
		let keys = this.WHERE(condition);
		let rows = [];
		for(let keyskey=0; keyskey<keys.length; keyskey++){
			rows.push(this[keys[keyskey]]);
		}
		return rows;
	}
	
	Array.prototype.UPDATE = function(){}
	
	Array.prototype.DELETE = function(){}

//display services/////////////////////////////////////////////////////////////////////////
	Object.prototype.stretch = function( indchain = "", stretchedObj = {} )
	{
		for( let [ind, item] of Object.entries(this))
		{
			let indch = indchain == "" ? ind : indchain+"."+ind;
//		console.log([ indch, item, typeof item]);
			if( typeof item == 'object')
			{
			 stretchedObj = item.stretch( indch, stretchedObj );
			}
			else { stretchedObj[indch] = item; }
//		console.log(stretchedObj);
		}
		return stretchedObj;
	}
	// convenience service
	function ObjStretchArr(ObjArr){
		let stretchedObjArr = [];
		for(let o=0; o<ObjArr.length; o++)
		{
			// console.log(ObjArr[o].stretch());
			stretchedObjArr.push( ObjArr[o].stretch() );
		}
		return stretchedObjArr;
	}
	
	// HTML
		
	Array.prototype.HTML_TABLE = function(indent=0)
	{
		let indents = "\n"; for(let i=0; i<indent; i++){indents += "  ";}
		
		let html = "<table>";
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
		return html +indents+ "<table>";
	}
