export type ChainConfig = {
  name: string,
  type: string,
  pads?: string[]
}


export class AbletonChain {
  name: string;
  type: string;
  pads: string[];


  constructor(config: ChainConfig) {
    this.name = config.name;
    this.type = config.type;
    if (config.pads && config.pads.length > 0) {
      this.pads = config.pads;
    }
  }
}
