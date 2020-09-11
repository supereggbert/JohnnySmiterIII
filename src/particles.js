export default class Particles{
    constructor(){
        this.width=2000;
        this.height=2000;
        this.particles=[];
        for(let i = 0; i<300;i++){
            this.particles.push([Math.random()*1.2,Math.random()*1.2,Math.random()*0.5+0.6])
        }
    }
    tick(dt){
        dt*=1;
        var t = performance.now();
        var particles=this.particles;
        for(let i=0;i<particles.length;i++){
            this.particles[i][1]-=0.1*(particles[i][2]+0.2)*dt*(Math.sin(t*0.001)+0.75);
            this.particles[i][0]=(Math.sin(this.particles[i][1]*this.particles[i][2]+this.particles[i][2]*50)+1)*0.5;
            if(this.particles[i][1]<-0.2) this.particles[i][1]=1.2;
        }
    }
    draw(ctx,offset,size){
        ctx.save();
        ctx.fillStyle="rgba(0,0,0,0.2)";
        ctx.shadowBlur = 20;
        ctx.shadowColor="#000";
        var particles=this.particles;
        ctx.beginPath();
        var t=performance.now();
        for(let i=0;i<particles.length;i++){
            var x= particles[i][0]*this.width;
            var y= particles[i][1]*this.height;
            if(x<offset[0] || y<offset[1]) continue;
            if(x>offset[0]+size[0] || y>offset[1]+size[1]) continue;
            ctx.save();
            ctx.translate(x,y);
            var j = ((t+particles[i][2]*5000)%5000)/5000;
            ctx.rotate(j*Math.PI*2);
            var size = (particles[i][2]*particles[i][2]*particles[i][2]+0.2)*ctx.canvas.width*0.007*Math.sin(j*Math.PI*2);
            ctx.rect(-size,-size,size*2,size*2);
            ctx.rotate(0.57+j*Math.PI*2);
            ctx.rect(-size,-size,size*2,size*2);
            ctx.restore();
        }
        ctx.fill();
        ctx.restore();
    }
}