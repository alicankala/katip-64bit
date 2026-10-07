export class PinAttempts {
  private rows = new Map<string,{failures:number;until:number;last:number}>()
  check(key:string,now=Date.now()): void { const row=this.rows.get(key); if(row && now < row.until) throw new Error('Çok fazla PIN denemesi. Biraz sonra tekrar deneyin.') }
  result(key:string,success:boolean,now=Date.now()): void {
    if(success){this.rows.delete(key);return}
    for(const [id,row] of this.rows) if(now-row.last>30*60*1000)this.rows.delete(id)
    const old=this.rows.get(key), failures=(old && now-old.last<15*60*1000 ? old.failures : 0)+1
    this.rows.set(key,{failures,last:now,until:failures>=5 ? now+Math.min(15*60*1000,30*1000*2**Math.min(failures-5,5)):0})
  }
}
