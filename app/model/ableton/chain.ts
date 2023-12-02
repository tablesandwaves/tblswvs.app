export type ChainConfig = {
  name: string,
  type: string
}


export class AbletonChain {
  name: string;
  type: string;


  constructor(config: ChainConfig) {
    this.name = config.name;
    this.type = config.type;
  }
}
