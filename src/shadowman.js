//const BODYPATH=new Path2D("M.94-46.505c-1.832-.065-1.874 6.95-6.032 10.156-4.158 3.208-3.651 15.77-.496 25.658.633 11.695.425 13.963 5.614 14.513C5.216 4.37 5.65.795 6.497-10.424c3.592-10.156 3.987-22.676-.076-26.161-4.06-3.482-3.65-9.855-5.482-9.92z");
const BODYPATH=new Path2D("m0.93-46.505c-1.83-0.06-1.87 6.94-6.03 10.15-4.15 3.20-4.98 17.37-1.83 27.26 0.63 11.69 1.73 13.15 6.95 12.90 5.45-0.25 7.22-1.69 8.07-12.90 3.59-10.15 2.38-24.01-1.68-27.49-4.05-3.48-3.64-9.85-5.48-9.91z");


const ARMTOP = new Path2D("M0 3.207c9.875-.197 6.24 8.552 5.078 18.175C3.917 31.004 3.034 36.732 0 36.616c-3.034-.115-3.717-9.021-5.345-15.769C-6.973 14.099-9.875 3.404 0 3.207z");
//const ARMBOTTOM = new Path2D("M0-4.009c5.598-.464 4.874 6.673 4.402 14.23-.472 7.558-2.087.744-.413 7.023C5.198 19.57 1.468 23.1 0 28.331c-1.307-5.446-5.699-7.924-3.975-11.291 1.817-5.635.31.342-.176-6.188C-4.637 4.32-5.405-3.561 0-4.01z");
const ARMBOTTOM = new Path2D("M0-4.00c5.59-.46 3.53 2.53 3.06 10.08-.47 7.55-.75 4.88.92 11.16C5.19 19.57 1.72 28.36 0 28.33c-1.72-.037-5.69-7.92-3.97-11.29 1.81-5.63 1.11-4.87.62-11.4C-3.83-.89-5.40-3.56 0-4.01z");



const LEGTOP = new Path2D("M0-4.009c6.935-.197 7.041 17.64 4.009 26.727C.977 31.806 3.034 36.73 0 36.616c-3.034-.115-2.114-6.348-4.276-13.63C-6.44 15.702-6.935-3.813 0-4.01z");
const LEGBOTTOM = new Path2D("M0-4.009c5.598-.464 6.24 6.147 4.544 13.363C.71 20.848 6.604 34.666 0 34.745c-6.366.076-1.045-14.634-4.009-25.658C-5.637 3.141-5.405-3.56 0-4.009z");
const FOOT = new Path2D("M.005-3.401c4.124 4.962 11.991 9.827 6.534 9.233-5.457-.595-7.246-.401-12.233.096C-10.68 6.426-2.136.803.005-3.4z");
const HEAD = new Path2D("m -0.08,-3.60 c 6.35,6.49 9.49,22.69 9.35,16.91 -0.33,-14.30 4.37,5.61 0.81,10.43 -6.54,9.39 -17.36,6.54 -21.53,-1.45-2.08,-3.99 1.92,-20.95 2.19,-9.49 0.13,5.67 2,-9.69 9.16,-16.40 z");
//const HEAD = new Path2D("M.005-10.221C12.719 2.774 17.2 14.106 10.082 23.746c-6.548 9.394-17.36 6.542-21.53-1.453C-15.62 14.3-14.318 3.207.004-10.22z");

const walkframes=[
    [0,0,0,-3,0.13,-0.04,0],[0.33,0.75,-0.17,5,0.58,0.05,0.05],[-0.27,0.66,-0.09,-3,0.02,-0.33,0],[-0.85,1.06,-0.35,5,-0.45,-0.31,0.05]
];
const idleframes=[
    [0.3,-0.1,-0.2,0,0.5,-0.1,-0.01],[0.32,-0.18,-0.12,1,0.47,-0.15,0.01]
]
function lerp(x1,x2,t){
    return x2*t+x1*(1-t);
}
export default class ShadowMan{
    constructor(){
        this.x=0;
        this.y=0;
        this.state={}
        this.frame=0;
        this.walking=0;
        this.mode="idle";
        this.floorAngle=0;
        this.mag=1;
        this.last=performance.now();
    }
    idle(){
        var off0 = this.lerpanim(idleframes,this.frame*0.3,0,1);
        var off1 = this.lerpanim(idleframes,this.frame*0.3,0.2,1);
        return{
            lleg1:[-5,0,off0[0]],
            lleg2:[0,30,off0[1]],
            lfoot:[0,30,off0[2]],

            rleg1:[5,0,-off1[0]],
            rleg2:[0,30,-off1[1]],
            rfoot:[0,30,-off1[2]],

            hip:[0,off0[3],0],
            head:[0,-70,off1[6]],

            larm1:[-5,-40,off1[4]],
            larm2:[0,30,off1[5]],
            rarm1:[5,-40,-off0[4]],
            rarm2:[0,30,-off0[5]],
        }
    }
    lerpanim(anim,frame,offset,mag){
        var len=anim.length;
        
        var f = (frame+offset*len) % len;
        var f1 = Math.floor(f);
        var f2 = Math.ceil(f) % len;
        var t= f%1;
        var result=[];
        for(let i=0;i<anim[0].length;i++){
            result.push(lerp(anim[f1][i],anim[f2][i],t)*mag)
        }
        return result;
    }
    
    walk(d){
        var phase = Math.sin(this.frame*0.25);
        var off0 = this.lerpanim(walkframes,this.frame,d==1?0:0.5,1*this.mag);  
        var off1 = this.lerpanim(walkframes,this.frame,d==1?0.5:0,1*this.mag); 
        var off3 = this.lerpanim(walkframes,this.frame*0.75+phase*0.25,d==1?0.2:0.7,1.2*this.mag);  
        var off4 = this.lerpanim(walkframes,this.frame*0.75+phase*0.25,d==1?0.7:0.2,1.2*this.mag);  
        return {
            lleg1:[-5*d,0,off0[0]*d],
            lleg2:[0,30,off0[1]*d],
            lfoot:[5*d,30,off0[2]*d],

            rleg1:[5*d,0,off1[0]*d], 
            rleg2:[0,30,off1[1]*d],
            rfoot:[5*d,30,off1[2]*d],
            
            hip:[0,off0[3],0],
            head:[0,-70,off3[6]*d],

            larm1:[-5*d,-40,off3[4]*d],
            larm2:[0,30,off3[5]*d],
            rarm1:[5*d,-40,off4[4]*d],
            rarm2:[0,30,off4[5]*d]
        }

    }
    walkLeft(){
        return this.walk(-1);
    }
    walkRight(){
        return this.walk(1);
    }
    transform(ctx,transform){
        ctx.translate(transform[0],transform[1]);
        ctx.rotate(transform[2]);
    }
    drawLegs(ctx){
        var state = this.state;

        //left
        ctx.save();
        //if(this.mode!="idle") ctx.fillStyle="#444";
        this.transform(ctx,state.lleg1);
        ctx.fill(LEGTOP);
        this.transform(ctx,state.lleg2);
        ctx.fill(LEGBOTTOM);
        this.transform(ctx,state.lfoot);
        ctx.fill(FOOT);
        ctx.restore();

        //right
        ctx.save();
        this.transform(ctx,state.rleg1);
        ctx.fill(LEGTOP);
        this.transform(ctx,state.rleg2);
        ctx.fill(LEGBOTTOM);
        this.transform(ctx,state.rfoot);
        ctx.fill(FOOT);
        ctx.restore();
    }
    drawArms(ctx){
        var state = this.state;

        //left
        ctx.save();
        this.transform(ctx,state.larm1);
        ctx.fill(ARMTOP);
        this.transform(ctx,state.larm2);
        ctx.fill(ARMBOTTOM);
        ctx.restore();

        //right
        ctx.save();
        this.transform(ctx,state.rarm1);
        ctx.fill(ARMTOP);
        this.transform(ctx,state.rarm2);
        ctx.fill(ARMBOTTOM);
        ctx.restore();

    }
    drawHead(ctx){
        var state = this.state;

        //left
        ctx.save();
        this.transform(ctx,state.head);
        ctx.fill(HEAD);
        ctx.restore();
    }
    mix(a1,a2,t){
        var channel;
        var result={};
        for(channel in a1){
            var frame=[];
            for(let i=0;i<a1[channel].length;i++){
                frame.push(a1[channel][i]*t+a2[channel][i]*(1-t))
            }
            result[channel]=frame
        }
        return result;
    }
    setMode(type){
        if(this.mode!=type){
            this.frame=0;
            this.mode=type;
            this.oldState=this.state;
            this.modeChanged=performance.now();
        }
    }
    animate(){
        this.state=this[this.mode]();
        if(this.oldState){
            var dt = Math.min(1,(performance.now()-this.modeChanged)/100);
            this.cross = dt;
            this.state=this.mix(this.state,this.oldState,dt)
        }
    }
    draw(ctx){
        var time=performance.now();
        this.frame+=0.01*(time-this.last);
        this.last=time;
        this.animate();
        ctx.save();
        ctx.fillStyle="#000";
        //ctx.shadowBlur = 7*Math.sin(this.frame)+20;
        //ctx.shadowColor="#000";
        //ctx.shadowOffsetY = -Math.abs(5*Math.sin(this.frame*3));
        //ctx.shadowOffsetX = 2*Math.sin(this.frame*2);
        ctx.translate(this.x,this.y);
        this.transform(ctx,this.state.hip);
        ctx.rotate(this.floorAngle); //rotate for platforms
        this.drawLegs(ctx);
        ctx.rotate(-this.floorAngle*0.25);//rotate for platforms
        ctx.fill(BODYPATH);
        this.drawArms(ctx);
        ctx.rotate(this.floorAngle*0.1);//rotate for platforms
        this.drawHead(ctx);
        ctx.restore();
    }
}