export type ChainConfig = {
  name: string
}


export class AbletonChain {
  name: string;
  active: boolean = false;


  constructor(name: string) {
    this.name = name;
  }
}
