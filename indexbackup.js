
import ShadowMan from './shadowman.js';
import Particles from './particles.js';
import {music,twinkle} from './song.js';
/*
ellisias: greeting strange sole, I amd elliasias farry god, you seem out of place in this realm may I ask you business
Johny: I was battling an achient witch in my home realm of karr, see cursest me transforming me into a shadow walker and sending me here
elliaisas: I may be able to help, it would seem you have fallen fowl of the lost curse, to break the curse and be restored to your former self and realm you must quest for the 3 secred numbers and read them aloud
I will help guide you with my fary light, just point where you wish me to go and I will light your path
*/
var playing=false;
document.addEventListener("mousedown",()=>{
    if(!playing){
        music();
        playing=true;
    }
})

var SPIDERBOD = new Path2D("M-.053-6.943c-1.832-.094-4.984 4.357-4.905 6.507.08 2.15 2.168 2.613 3.482 3.219-.837 2.38.343 2.767-.122 4.709C.087 5.706.636 5.686 1.829 7.432c-.15-2.098 1.005-3.082-.364-4.72 0 0 4.125-.07 4.06-3.266C5.46-3.751 1.78-6.85-.053-6.944z");

/*var canvas=document.createElement("canvas");
canvas.width=innerWidth;
canvas.height=innerHeight;
var ctx=canvas.getContext("2d");
setTimeout(()=>{document.body.appendChild(canvas)});*/
var s=(c)=>c.save();
var r=(c)=>c.restore();

var brickT=function(size,color){
    var canvas=document.createElement("canvas");
    canvas.height=canvas.width=500;
    var ctx=canvas.getContext("2d");

    var brickWidth=40*size;
    var morter=2*size;
    var brickHeight=20*size;
    ctx.fillStyle="#111";
    ctx.fillRect(0,0,500,500);
    ctx.fillStyle="#222";
    for(let x=0;x<70;x++){
        for(let y=0; y<70;y++){
            var x1=x*(brickWidth+morter) - (y%2)*brickWidth*0.5;
            var y1=y*(brickHeight+morter);
            ctx.shadowBlur=5;
            ctx.shadowColor="#000";
            ctx.fillRect(x1,y1,brickWidth,brickHeight);
            ctx.shadowBlur=2;
            ctx.shadowColor="#888";
            ctx.fillRect(x1+3,y1+3,brickWidth-6,brickHeight-6);
        }
    }
    ctx.fillStyle="#000";
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha=color;
    ctx.fillRect(0,0,500,500);
    return canvas;
}



class Light{
    constructor(x,y){
        this.x=x;
        this.y=y;
        this.targetX = x;
        this.targetY = y;
    }
    tick(dt){
        this.x+=(this.targetX-this.x)*dt*0.05;
        this.y+=(this.targetY-this.y)*dt*0.05;
    }
    setTarget(x,y){
        this.targetX=x;
        this.targetY=y;
    }
    draw(ctx){
        s(ctx);
        var time=performance.now();
        var dx=Math.sin(time*0.01)*10;
        var dy=Math.sin(time*0.015)*10;
        ctx.translate(this.x+dx,this.y+dy);
        var gradient = ctx.createRadialGradient(0,0,0, 0,0,15);

        // Add three color stops
        gradient.addColorStop(0.4, '#fff');
        gradient.addColorStop(.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle=gradient;
        ctx.beginPath();
        ctx.arc(0,0,15,0,Math.PI*2);
        ctx.fill();
        r(ctx);
    }
    drawGlow(ctx){
        s(ctx);
        var time=performance.now();
        var dx=Math.sin(time*0.01)*50;
        ctx.globalCompositeOperation ="hard-light";
        var gradient = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,800+dx);

        // Add three color stops
        gradient.addColorStop(0, '#eef');
        gradient.addColorStop(.5, '#222');
        ctx.fillStyle=gradient;
        ctx.fillRect(-10000,-10000,20000,20000);
        r(ctx);
    }
}

class BoundCircle{
    constructor(x,y,radius){
        this.x=x;
        this.y=y;
        this.radius=radius;
    }
    segmentIntersect(x1,y1,x2,y2){
        var dx = x2-x1;
        var dy = y2-y1;
        
        var d = Math.sqrt(dx*dx+dy*dy);
        dx/=d;dy/=d;

        //calc point distance from line
        var px = this.x-x1;
        var py = this.y-y1;
        var distance = px * dy - py*dx;

        //if not intersecting line the no hit
        if(distance > this.radius || distance<0) return false;

        //get point of intersection
        var x = this.x - dy * distance;
        var y = this.y + dx * distance;

        var l1 = x1*dx+y1*dy;
        var l2 = x2*dx+y2*dy;
        var l = x*dx+y*dy;
        if(l>l1 && l<l2){
            return {
                normal: [dy,-dx],
                depth: this.radius - distance
            };
        }

        // if we get here then check distance from end points
        var dx1 = this.x - x1;
        var dy1 = this.y - y1;
        var d1 = Math.sqrt(dx1*dx1+dy1*dy1);

        if(d1<this.radius){
            return {
                normal: [dx1/d1,dy1/d1],
                depth: this.radius-d1
            };
        }
        return false;

    }
}

class ShadowBox{
    constructor(x,y,width,height){
        this.x=x;
        this.y=y
        this.width=width;
        this.height=height;
        this.points=[
            [this.x, this.y], [this.x+width, this.y], [this.x+width, this.y+height], [this.x, this.y+height]
        ];
        this.projectPoints=[ [0,0],[0,0],[0,0],[0,0] ];
        this.paths=[];
    }
    calcShadowAreas(light){
        this.projectPoints = this.points.map((el,idx)=>{
            var dx = el[0]-light.x;
            var dy = el[1]-light.y;
            var d = Math.sqrt(dx*dx+dy*dy);
            return [dx/d*10000+el[0]*0.1+this.projectPoints[idx][0]*0.9,dy/d*10000+el[1]*0.1+this.projectPoints[idx][1]*0.9];
        })
    }
    drawShadows(ctx){
        s(ctx);
        //ctx.globalCompositeOperation ="luminosity";
        var points = this.points;
        var projectPoints = this.projectPoints;
        var len = points.length;
        this.paths=[]
        for(let i=0;i<len;i++){
            var idx1 = i;
            var idx2 = (i+1)%len;
            var path = new Path2D();
            path.moveTo(projectPoints[idx1][0],projectPoints[idx1][1]);
            path.lineTo(projectPoints[idx2][0],projectPoints[idx2][1]);
            path.lineTo(points[idx2][0],points[idx2][1]);
            path.lineTo(points[idx1][0],points[idx1][1]);
            path.closePath();
            ctx.fill(path);
            ctx.stroke(path);
            this.paths.push(path)
        }
        r(ctx);
    }
    drawPlatform(ctx){
        s(ctx);
        ctx.fillStyle=brick;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        r(ctx);
    }
    collisionBox(boundCircle,shadows){
        //return intersection normal and distance
        //get list of line segments
        var segments = [];
        var len = this.points.length;
        for(let i =0; i < len; i++){
            var idx1 = i
            var idx2 = (i+1)%len;
            if(shadows){
            segments.push([this.projectPoints[idx1][0],this.projectPoints[idx1][1],this.points[idx1][0],this.points[idx1][1]]);
            segments.push([this.points[idx1][0],this.points[idx1][1],this.projectPoints[idx1][0],this.projectPoints[idx1][1]]);
            }else{
            segments.push([this.points[idx1][0],this.points[idx1][1],this.points[idx2][0],this.points[idx2][1]]);
            }
        }

        //test all segments and return results
        var results = [];
        for(let i = 0; i<segments.length; i++){
            var s = segments[i];
            var result = boundCircle.segmentIntersect(s[0],s[1],s[2],s[3]);
            if(result) results.push(result);
        }
        return results;
    }
}
class Spikes extends ShadowBox{
    constructor(x,y,width,height){
        super(x,y,width,height);
    }
    draw(ctx){
        var cnt = Math.floor(this.width/5);
        var width = this.width/cnt;
        s(ctx);
        ctx.beginPath();
        ctx.lineWidth=5;
        ctx.shadowBlur="10";
        ctx.shadowOffsetY="-10";
        ctx.shadowColor="#222";
        ctx.translate(this.x,this.y+this.height);
        ctx.moveTo(0,0);
        for(let i=1;i<cnt;i++){
            ctx.lineTo(i*width+Math.random()*10,-(i%2)*this.height*width*Math.random()*0.2);
        }
        ctx.lineTo(this.width,0);
        ctx.fillStyle="#faa";
        ctx.strokeStyle="#440";
        ctx.stroke();
        ctx.fill();
        r(ctx);
    }
}
const GRAVITY = 10;
class Player{
    constructor(x,y,map){
        this.map=map;
        this.bound = new BoundCircle(x,y,50);
        this.velocity = [0,0];
        this.inShadow = false;
        this.man=new ShadowMan();
        this.floorNormal=[0,-1];
        this.onfloor = true;
    }
    tick(dt, shadowboxes){
        this.inShadow=this.map.pointInShadow(this.bound.x,this.bound.y);
        if(this.inShadow){
            this.velocity=[0,0];
            return;
        }
        this.velocity[0]*=0.5;
        this.velocity[1]*=0.5;
        this.velocity[1]+=GRAVITY*dt;
        this.bound.x += this.velocity[0]*dt;
        this.bound.y += this.velocity[1]*dt;
        const testCount=5;
        var floorNormal = [0,0];
        for( let k = 0; k<testCount;k++){
            var maxd=0;
            var result=false;
            var shadows = k<1;
            for(let i = 0;i<shadowboxes.length;i++){
                var results = shadowboxes[i].collisionBox(this.bound,shadows);
                for(let j =0;j<results.length;j++){
                    if(results[j].depth>maxd){
                        maxd=results[j].depth;
                        result = results[j];
                    }
                }
            }
            if(result){
                if(floorNormal[1]>result.normal[1]){
                    floorNormal=result.normal;
                }
                var r = result;
                this.bound.x+=r.normal[0]*r.depth;
                this.bound.y+=r.normal[1]*r.depth;
                //kill velocity in direction of impact
                var d=this.velocity[0]*r.normal[0]+this.velocity[1]*r.normal[1];
                this.velocity[0]-=r.normal[0]*d;
                this.velocity[1]-=r.normal[1]*d;
            }
        }
        if(floorNormal[1]!=0){
            this.floorNormal=floorNormal;
            this.onfloor = true;
        }else{
            this.onfloor = false;
            this.floorNormal=[0,-1];
        }
    }
    isDead(){
        var spikes=this.map.spikes;
        for(let i=0;i<spikes.length;i++){
        var results = spikes[i].collisionBox(this.bound,false);
        if(results.length>0) return true;
        }
        return false;
    }
    draw(ctx){
        if(this.inShadow) return;
        s(ctx);
        ctx.translate(this.bound.x,this.bound.y-4);
        ctx.scale(0.85,0.85);
        this.man.draw(ctx);
        if(this.velocity[0]>0.5) this.man.setMode("walkRight");
        else if(this.velocity[0]<-0.5) this.man.setMode("walkLeft");
        else this.man.setMode("idle");
        r(ctx);
    }
}
class KeyStates{
    constructor(){
        this.states = {};
        document.addEventListener("keydown",this.keydown.bind(this));
        document.addEventListener("keyup",this.keyup.bind(this));
    }
    keydown(e){
        this.states[e.keyCode]=true;
    }
    keyup(e){
        this.states[e.keyCode]=false;
    }
}

class Map{
    constructor(ctx){
        this.ctx=ctx;
        this.targetOffset=[0,0];
        this.offset=[0,0];
        this.size=[2000,2000];
        this.viewport=[innerWidth,innerHeight];
        this.boxes=[];
        for(let i=0;i<MAP.length;i+=4){
            this.boxes.push(new ShadowBox(MAP[i]*20,MAP[i+1]*20,MAP[i+2]*20,MAP[i+3]*20));
        }
        this.spikes=[];
        for(let i=0;i<SPIKES.length;i+=4){
            this.spikes.push(new Spikes(SPIKES[i]*20,SPIKES[i+1]*20,SPIKES[i+2]*20,SPIKES[i+3]*20));
        }
        this.spiders=[];
        for(let i=0;i<SPIDERS.length;i+=3){
            this.spiders.push(new Spider(SPIDERS[i]*20,SPIDERS[i+1]*20,SPIDERS[i+2]*20));
        }
        /*this.boxes = [
            new ShadowBox(50,250,200,50),
            new ShadowBox(1000,0,300,500),
            new ShadowBox(-280,0,300,500),
            new ShadowBox(0,500,1024,5)
        ];*/
    }
    pointInShadow(x,y){
        var len = this.boxes.length;
        for(let i = 0; i<len;i++){
            let box = this.boxes[i];
            for(let j=0; j<box.paths.length;j++){
                if(this.ctx.isPointInPath(box.paths[j],x,y)){
                    return true;
                }
            }
        }
        return false;
    }
    draw(ctx){
        this.spikes.forEach((spike)=>{
            spike.draw(this.ctx);
        })
        this.spiders.forEach((spider)=>{
            spider.draw(this.ctx);
        })
    }
    drawWithShadows(ctx,light,player){

        s(ctx);
        ctx.fillStyle=bricksl;
        ctx.fillRect(-10000,-10000,20000,20000);
        light.drawGlow(ctx);
        this.draw();
        ctx.globalCompositeOperation="destination-out";
        this.boxes.forEach((box)=>{
            box.calcShadowAreas(light);
            box.drawShadows(this.ctx);
        });
        player.draw(ctx);
        ctx.globalCompositeOperation="destination-over";
        ctx.fillStyle="rgba(0,0,0,0.8)";
        ctx.fillRect(-10000,-10000,20000,20000);
        this.draw();
        ctx.fillStyle=bricksl;
        ctx.fillRect(-10000,-10000,20000,20000);
        r(ctx);
        this.boxes.forEach((box)=>{
            box.drawPlatform(this.ctx);
        })
    }
    setTranslation(ctx, dt){
        this.offset[0]+=(this.targetOffset[0]-this.offset[0])*dt*0.1;
        this.offset[1]+=(this.targetOffset[1]-this.offset[1])*dt*0.1;
        ctx.translate(-this.offset[0],-this.offset[1]);
    }
    setCenter(center){
        var x = center.x - this.viewport[0]*0.5;
        var y = center.y - this.viewport[1]*0.5;
        //clamp to map
        this.targetOffset[0] = Math.max(0, Math.min(this.size[0] - this.viewport[0], x));
        this.targetOffset[1] = Math.max(0, Math.min(this.size[1] - this.viewport[1], y));
    }

}


class Spider{
    constructor(x,y,height){
        this.offset=Math.random()*5000;
        this.x=x;
        this.y=y;
        this.height=height;
    }
    draw(ctx){
        s(ctx);
        ctx.fillStyle="#000";
        var t=((performance.now()+this.offset)%5000 - 2500)/2500;
        if(t<1) t=t*t;
        ctx.fillRect(this.x,this.y, 3, this.height*t);
        ctx.translate(this.x+1.5,this.y+this.height*t);
        ctx.scale(3.5,3.5);
        ctx.fill(SPIDERBOD);
        ctx.beginPath();
        ctx.moveTo(5,5);
        ctx.lineTo(50,5);
        ctx.lineWidth=10;
        ctx.stroke();
        r(ctx);


    }
}

class showBubble{
    constructor(text,x,y,time){
        this.time=time;
        var speech=document.createElement("div");
        speech.style="position: absolute; background-color: #777700;padding: 10px;width: 300px;transform:translate(-50%,-100%)";
        speech.style.left=x+"px";
        speech.style.top=y+"px";
        speech.innerHTML=text;
        this.speech=speech;
    }
    show(){
        document.body.appendChild(this.speech);
        return new Promise((r)=>{
            var f=()=>{
                clearTimeout(timer);
                document.removeEventListener('keydown',f);
                document.body.removeChild(this.speech);
                r();
            }
            document.addEventListener('keydown',f);
            var timer=setTimeout(f,this.time);

        });

    }
}


const MAP = [99,0,1,100,0,99,100,1,0,0,1,100,0,0,100,1,35,89,64,1,35,97,40,2,35,78,5,11,50,75,5,14,65,78,5,11,80,75,19,14,1,85,19,2,7,77,4,8,15,92,10,7,0,68,32,2,30,50,2,19,42,64,5,2,57,64,5,2,72,64,5,2,1,40,82,2,85,63,4,2,85,54,4,2,85,46,4,2,85,38,4,2,52,42,31,13,7,50,23,2,35,10,64,2,55,25,5,15,50,30,5,2,35,25,5,15,20,25,5,15,5,29,10,2,10,18,10,2,24,13,7,2,16,58,14,2,1,58,7,2,60,28,18,7]
const SPIKES = [40,87,10,2,55,87,10,2,70,87,10,2,40,38,5,2,25,38,10,2,1,83,6,2];
const SPIDERS = [66,55,15,52,55,15,64,12,15,26,52,5];
class Level{
    constructor(ctx){
        this.ctx=ctx;
        this.reset();
        this.keyStates = new KeyStates;
        this.particles = new Particles;
        this.started=false;
        document.addEventListener("mousedown",(e)=>{
            if(e.buttons===1 && this.started){
                twinkle();
                this.light.setTarget(e.clientX+this.map.offset[0],e.clientY+this.map.offset[1]);
            }
        });

        setTimeout(()=>{
            var pp=[this.player.bound.x-this.map.targetOffset[0],this.player.bound.y-this.map.targetOffset[1]-100];
            var lp=[this.light.x-this.map.targetOffset[0],this.light.y-this.map.targetOffset[1]-50];
            var opening=[
                [lp,"Greeting strange soul, I am elliasias ferry god, you seem out of place in this realm may I ask you business"],
                [pp,"I'm Johnny, I was battling an achient witch in my home realm of Jar when she did some kind of spell and I found myself here"],
                [lp,"I may be able to help, it would seem you have fallen fowl of the lost page of the necronomicon, page 404, containing the curse of the shadow walker."],
                [lp,"To break the curse and be restored to your former self and realm you must find the 3 secred numbers and read them aloud"],
                [lp,"I will help guide you with my fary light, just point where you wish me to go and I will light your path (mouse)"],
                [lp,"You can navigate this place with your legs [keyboard A,D]"],
                [pp,"I did already know howto walk, but thank your for your kind assistance."]
            ];
            var diag=()=>{
                if(opening.length>0){
                    var p=opening.shift();
                    (new showBubble(p[1],p[0][0],p[0][1],7500)).show().then(diag);
                }else{
                    this.started=true;
                }
            };
            diag();
        },2000);
        this.loop();
    }
    reset(){
        this.map = new Map(this.ctx);
        this.player = new Player(1800,1800,this.map);
        this.light = new Light(1600,1900);
    }
    loop(){
        var ctx=this.ctx;
        var stepSpeed=10;
        var player = this.player;
        var newangle = Math.atan2(player.floorNormal[0],-player.floorNormal[1]);
        player.man.floorAngle += (newangle-player.man.floorAngle)*0.3;
        if(this.started){
            if(this.keyStates.states[39] || this.keyStates.states[68]){
                player.velocity[0]=-player.floorNormal[1]*stepSpeed;
                player.velocity[1]=player.floorNormal[0]*stepSpeed*2;
            }
            if(this.keyStates.states[37] || this.keyStates.states[65]){
                player.velocity[0]=player.floorNormal[1]*stepSpeed;
                player.velocity[1]=-player.floorNormal[0]*stepSpeed*2;
            }
        }
        var speed=Math.sqrt(player.velocity[0]*player.velocity[0]+player.velocity[1]*player.velocity[1]);
        this.player.man.mag=Math.min(1,Math.abs(speed)/10*0.5+0.5);

        
        this.light.tick(0.55);
        this.particles.tick(0.015);
        this.player.tick(0.55,this.map.boxes);

        this.map.setCenter(this.player.bound);
        s(ctx);
        this.map.setTranslation(ctx,0.55);

        
        
        this.map.drawWithShadows(ctx,this.light, this.player);
        this.light.draw(ctx);

        if(this.player.isDead()){
            this.reset();
        }

        r(ctx);
        s(ctx);
        this.map.setTranslation(ctx,0);

        this.particles.draw(ctx);
        r(ctx);
        requestAnimationFrame(this.loop.bind(this));
    }
}

//var level = new Level(ctx);
var brick,bricksd,bricksl;
setTimeout(()=>{
    var canvas=document.querySelector("canvas");
    canvas.width=innerWidth;
    canvas.height=innerHeight;
    var ctx=canvas.getContext("2d");

    brick = ctx.createPattern(brickT(0.5,0.5), 'repeat');
    bricksd = ctx.createPattern(brickT(0.4,0.7), 'repeat');
    bricksl = ctx.createPattern(brickT(0.4,0), 'repeat');

    var particles = new Particles();
    particles.width=innerWidth;
    particles.height=innerHeight;
    var title=true;
    var anim=()=>{
        if(title){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        particles.tick(0.01);
        particles.draw(ctx);
        requestAnimationFrame(anim);
        }
    };
    anim();
    document.querySelector("b").onclick=()=>{
        document.querySelector("main").style.display="none";
        title=false;
        var level = new Level(ctx);
    }
})
