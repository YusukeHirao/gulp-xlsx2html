declare module "typed-table" {

export class TypedTable {
	
	constructor (rows: any, rowOption: any);
	
	public toJSON (): any;
}
	
export function readExcel (filePath: string, rowOption: any): TypedTable[];


}