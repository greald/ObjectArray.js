	class NestObj
	{
		constructor(object)
		{
			Object.assign(this, object);
//		console.log( Object.keys(object) );
			this.included = Object.keys(object);
			
			this.stretchedAlready = false;
			this.stretchedColmnNames = [];
//  		this.privates = ["privates", "stretchedColmnNames"];
		}
		
		columnNaming(indchain = "", sCNames=[], shackle = ".")
		{
//		console.log([indchain,sCNames]);
			let indch = '';
			for( let [ind, item] of Object.entries(this))
			{
//			if( ! this.privates.includes(ind))
				if( this.included.includes(ind))
				{
					indch = indchain == "" ? ind : indchain + shackle + ind;
					if(typeof item == 'object')
					{
					item = new NestObj(item); 
						sCNames = item.columnNaming(indch, sCNames, shackle); 
					}
					else{ sCNames.push(indch)}
				}
			}
//		console.log([this.stretchedColmnNames, sCNames]);
			this.stretchedColmnNames = sCNames.concat(this.stretchedColmnNames);
			console.log(this.stretchedColmnNames);
			return sCNames;
		}
}
