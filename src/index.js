
import ShadowMan from './shadowman.js';
import Particles from './particles.js';
import {music,twinkle,dead,collect} from './song.js';
var T = performance.now();

var playing=false;
document.addEventListener("mousedown",()=>{
    if(!playing){
        playing=true;
        setTimeout(music,1500);
    }
})

var SPIDERBOD = new Path2D("M-.053-6.943c-1.832-.094-4.984 4.357-4.905 6.507.08 2.15 2.168 2.613 3.482 3.219-.837 2.38.343 2.767-.122 4.709C.087 5.706.636 5.686 1.829 7.432c-.15-2.098 1.005-3.082-.364-4.72 0 0 4.125-.07 4.06-3.266C5.46-3.751 1.78-6.85-.053-6.944z");
var SPIDERLEG = new Path2D("m-0.84,-0.10c0,0 47.81,14.12 12.68,37.08C32.34,16.02 -0.19,6.72 -0.19,6.7 Z");
var MAGE = new Path2D("M64.7 64.08L56.93 83.69c-19.27 8.70-22.52 31.14.52 42.55 0 0 2.07 4.18-9.01 10.27-8.58 19.22-7.75 45.28-6.292 75.33l10.77-61.04L50.27 263.26l24.38.37s17.57-8.19-4.34-9.07c-14.17-.56-16.7-6.63-5.67-49.70 9.375 4.82-16.55 43.07-1.18 48.36 0 0 13.46-46.01 18.50-52.07 24.08-28.98-9.663-52.13-9.663-52.13l21.26 16.34 22.68-6.80 15.12-1.7-18.14-1.32-19.75 3.02-21.73-28.45s-8.99-7.79-.09-3.3 26.40-10.39-.8-40.25c-7.56-3.59-6.11-22.47-6.11-22.47z");
var WINDOW = new Path2D("M-0.75,-29.86 C-20.13,-18.72 -16.25,30.61 -16.25,30.61 l33.63,0.37 c0,0 3.50,-45.53 -18.14,-60.85 z");

var DOSHADOWS = true;

var brickT=function(size,color){
    var canvas=document.createElement("canvas");
    
    var ctx=canvas.getContext("2d");

    var brickWidth=80*size;
    var morter=2*size;
    var brickHeight=40*size;
    canvas.height=canvas.width=brickWidth*5.3;
    ctx.save();
    ctx.fillStyle="#111";
    ctx.fillRect(0,0,500,500);
    ctx.fillStyle="#222";
    var y1=0;
    for(let y=0; y<70;y++){
        var x1=-(y%2)*brickWidth*0.5;
        for(let x=0;x<70;x++){
           // var x1=x*(brickWidth+morter) - (y%2)*brickWidth*0.5;
            ctx.shadowBlur=5;
            ctx.shadowColor="#000";
            ctx.fillRect(x1,y1,brickWidth,brickHeight);
            ctx.shadowBlur=2;
            ctx.shadowColor="#555";
            ctx.fillRect(x1+3,y1+3,brickWidth-6,brickHeight-6);
            x1+=(brickWidth*(0.75+(Math.random()+0.5)*0.25)+morter);
        }
        y1+=brickHeight+morter;
    }
    ctx.restore();
    color=Math.floor(color*255);
    ctx.fillStyle="rgb("+color+","+color+","+color+")";
    ctx.globalCompositeOperation = "multiply";
    //ctx.globalAlpha=color;
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
        ctx.save();
        var time=T;
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
        ctx.restore();
    }
    drawGlow(ctx){
        ctx.save();
        var time=T;
        var dx=Math.sin(time*0.01)*50;
        ctx.globalCompositeOperation ="hard-light";
        var gradient = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,800+dx);

        // Add three color stops
        gradient.addColorStop(0, '#eef');
        gradient.addColorStop(.5, '#222');
        ctx.fillStyle=gradient;
        ctx.fillRect(-10000,-10000,20000,20000);
        ctx.restore();
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
        ctx.save();
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
        ctx.restore();
    }
    drawPlatform(ctx,offset,size){
        if(this.x+this.width<offset[0] || this.y+this.height<offset[1] || this.x>offset[0]+size[0] || this.y>offset[1]+size[1]) return;
        ctx.save();
        //ctx.fillStyle=brick;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.translate(this.x,this.y);
        if(DOSHADOWS){
            ctx.shadowColor="#000";
            ctx.shadowBlur=canvas.height*0.03;
            ctx.shadowOffsetY=5;
        }
        ctx.fillStyle=bricksp;
        ctx.fillRect(-5, 0, this.width+10, 10);
        ctx.restore();
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
    draw(ctx,offset,size){
        if(this.x+this.width<offset[0] || this.y+this.height<offset[1] || this.x>offset[0]+size[0] || this.y>offset[1]+size[1]) return;
        var cnt = Math.floor(this.width/5);
        var width = this.width/cnt;
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth=5;
        ctx.translate(this.x,this.y+this.height);
        ctx.moveTo(0,0);
        for(let i=1;i<cnt;i++){
            ctx.lineTo(i*width+Math.random()*10,-(i%2)*this.height*width*Math.random()*0.2);
        }
        ctx.lineTo(this.width,0);
        ctx.stroke();
        ctx.fill();
        ctx.restore();
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
        this.numbersCollected = 0;
        this.start=T;
    }
    tick(dt, shadowboxes){
        if(T-this.start>5000) this.inShadow=this.map.pointInShadow(this.bound.x,this.bound.y);
        if(this.inShadow){
            this.velocity=[0,0];
            return;
        }
        this.velocity[0]-=this.velocity[0]*dt*0.5;
        this.velocity[1]-=this.velocity[1]*dt*0.5;
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
                //this.velocity[0]-=r.normal[0]*d;
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
        var spiders=this.map.spiders;
        for(let i=0;i<spiders.length;i++){
            var result = spiders[i].checkCollition(this.bound.x,this.bound.y);
            if(result) return true;
        }
        return false;
    }
    draw(ctx){
        if(this.inShadow) return;
        ctx.save();
        ctx.translate(this.bound.x,this.bound.y-4);
        ctx.scale(0.85,0.85);
        this.man.draw(ctx);
        if(this.velocity[0]>0.5) this.man.setMode("walkRight");
        else if(this.velocity[0]<-0.5) this.man.setMode("walkLeft");
        else this.man.setMode("idle");
        ctx.restore();
    }
}
class KeyStates{
    constructor(){
        this.states = {};
        document.addEventListener("keydown",this.keydown.bind(this));
        document.addEventListener("keyup",this.keyup.bind(this));
        [...document.querySelectorAll(".key")].map((el)=>{
            var timer;
            el.addEventListener("touchstart",(e)=>{
                e.stopPropagation();
                e.preventDefault();
                this.states[el.dataset.key]=true;
                clearTimeout(timer);
            })
            document.addEventListener("touchend",(e)=>{
                timer=setTimeout(()=>{
                    this.states[el.dataset.key]=false;
                },100);
            })
        });
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
        this.light=false;
        this.targetOffset=[0,0];
        this.windows=WINDOWS;
        this.offset=[0,0];
        this.size=[2000,2000];
        this.viewport=[ctx.canvas.width/SCALE,ctx.canvas.height/SCALE];
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
        this.numbers=[];
        for(let i=0;i<NUMBERS.length;i+=3){
            this.numbers.push(new Num(NUMBERS[i+1]*20,NUMBERS[i+2]*20,NUMBERS[i]));
        }
    }
    checkCollitions(player,light){
        var px=player.bound.x;
        var py=player.bound.y;
        this.numbers = this.numbers.filter((num)=>{
            var dx=num.x-px;
            var dy=num.y-py;
            var d = Math.sqrt(dx*dx+dy*dy);
            if(d>player.bound.radius){
                return true;
            }else{
                collect();
                player.numbersCollected+=num.number+1;
                var nc = player.numbersCollected;
                hud.innerHTML=(nc>2?'2 ':'X ') + (nc==4 || nc==5 || nc==1?' 0':' X') + (nc==5||nc==2?' 0':' X') ;
                return false;
            }
        });
        if(player.numbersCollected==5 && !light.told1){
            light.told1=true;
            var lp=[light.x-this.targetOffset[0],light.y-this.targetOffset[1]-50];
            (new showBubble("Your (re)quest was successful, now you must find the exit",lp[0],lp[1],7500,true)).show();
        }
    }
    pointInShadow(x,y){
        var len = this.boxes.length;
        for(let i = 0; i<len;i++){
            let box = this.boxes[i];
            for(let j=0; j<box.paths.length;j++){
                if(this.ctx.isPointInPath(box.paths[j],x*SCALE,y*SCALE)){
                    return true;
                }
            }
        }
        return false;
    }
    drawSpiders(){
        ctx.fillStyle="#000";
        this.spiders.forEach((spider)=>{
            spider.draw(this.ctx);
        })
    }
    draw(shadow){
        
        ctx.fillStyle="#faa";
        ctx.strokeStyle="#440";
        this.spikes.forEach((spike)=>{
            spike.draw(this.ctx,this.offset,this.size);
        });
        if(DOSHADOWS){
            ctx.save();
            ctx.shadowBlur=30;
            ctx.shadowColor="#000";
            ctx.fillStyle=brick;
            this.boxes.forEach((box)=>{
                box.drawPlatform(this.ctx,this.offset,this.size);
            })
            ctx.restore();
        }


        var len=this.windows.length;
        ctx.save();
        ctx.fillStyle=shadow?"#030303":"#333";
        ctx.scale(1.5,1.2);
        var x = 0, y=0;
        for(let i=0;i<len;i+=2){
            let x1=this.windows[i]*20/1.5, y1=this.windows[i+1]*20/1.2+20/1.2;
            ctx.translate(x1-x,y1-y);
            ctx.fill(WINDOW);
            x=x1;y=y1;
        }
        ctx.fillStyle=shadow?"#333":"#030303";
        for(let i=0;i<len;i+=2){
            let x1=this.windows[i]*20/1.5+3, y1=this.windows[i+1]*20/1.2+20/1.2-3;
            ctx.translate(x1-x,y1-y);
            ctx.fill(WINDOW);
            x=x1;y=y1;
        }
        ctx.restore();
        if((document.monetization && document.monetization.state === 'started') ||!shadow){
            this.numbers.forEach((num)=>{
                num.draw(this.ctx);
            })
        }
    }
    drawWithShadows(ctx,light,player){

        ctx.save();
        ctx.fillStyle=bricksl;
        ctx.fillRect(-10000,-10000,20000,20000);
        this.draw();





        light.drawGlow(ctx);
        this.drawSpiders();
        ctx.globalCompositeOperation="destination-out";
        this.boxes.forEach((box)=>{
            box.calcShadowAreas(light);
            box.drawShadows(this.ctx);
        });
        player.draw(ctx);
        ctx.globalCompositeOperation="destination-over";
        ctx.fillStyle="rgba(0,0,0,0.8)";
        ctx.fillRect(-10000,-10000,20000,20000);
        this.draw(true);
        this.drawSpiders();
        ctx.fillStyle=bricksl;
        ctx.fillRect(-10000,-10000,20000,20000);
        ctx.restore();



        ctx.save();
        ctx.fillStyle="#000";
        ctx.translate(80,1760);
        ctx.scale(0.85,0.85);
        ctx.fill(MAGE);
        //ctx.fillRect(0,80,100,100);
        ctx.restore();

        //draw exit
        if(player.numbersCollected==5){
            ctx.save();
            ctx.translate(1800,130);
            ctx.scale(3,3);
            if(DOSHADOWS){
                ctx.shadowBlur=50;
                ctx.shadowColor="#fff";
            }
            ctx.globalAlpha=Math.sin(T*0.005)+1.5;
            ctx.translate(-3,-3);
            ctx.fillStyle="#fff";
            ctx.fill(WINDOW);
            ctx.restore();
        }



        ctx.fillStyle=brick;
        this.boxes.forEach((box)=>{
            box.drawPlatform(this.ctx, this.offset, this.size);
        })
        if(this.light){
            ctx.save();
            ctx.globalCompositeOperation="overlay";
            ctx.fillStyle="#f00";
            ctx.fillRect(-10000,-10000,20000,20000);
            ctx.restore();
        }
    }
    setTranslation(ctx, dt){
        this.offset[0]+=(this.targetOffset[0]-this.offset[0])*dt*0.1;
        this.offset[1]+=(this.targetOffset[1]-this.offset[1])*dt*0.1;
        ctx.translate(-this.offset[0],-this.offset[1]);
    }
    setCenter(center){
        this.viewport=[this.ctx.canvas.width/SCALE,this.ctx.canvas.height/SCALE];
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
        this.lastpos=[0,0];
    }
    drawlegs(t,ctx){
        ctx.save();
        ctx.scale(0.2,0.2);
        ctx.translate(20,0);
        ctx.rotate(.25*Math.sin(t+2));
        ctx.fill(SPIDERLEG);
        ctx.translate(0,-7);
        ctx.rotate(-0.5+0.15*Math.sin(t));
        ctx.fill(SPIDERLEG);
        ctx.translate(0,-7);
        ctx.rotate(-0.5+0.25*Math.sin(t));
        ctx.fill(SPIDERLEG);
        ctx.restore();
        ctx.translate(0,6);
        ctx.scale(0.15,0.08);
        ctx.rotate(0.2+0.25*Math.sin(t*1.5));
        ctx.fill(SPIDERLEG);
    }
    draw(ctx){
        ctx.save();
        var d = 5000*this.height/300
        var t=((T+this.offset)%d - d*.5)/(d*.5);
        if(t<1) t=t*t;
        t=Math.min(1,Math.max(0,t+Math.sin(T*0.0005+this.offset)*0.2));

        ctx.fillRect(this.x,this.y, 3, this.height*t);
        ctx.translate(this.x+1.5,this.y+this.height*t);
        this.lastpos=[this.x+1.5,this.y+this.height*t];
        ctx.scale(3.5,3.5);
        
 
        //ctx.save();
        var t=T*0.01;
        ctx.fill(SPIDERBOD);
        ctx.save();
        this.drawlegs(t,ctx);
        ctx.restore();
        ctx.scale(-1,1);
        this.drawlegs(t,ctx);
        //ctx.restore();

        ctx.restore();
    }
    checkCollition(x,y){
        var dx= x-this.lastpos[0];
        var dy= y-this.lastpos[1];
        var d=Math.sqrt(dx*dx+dy*dy);
        if(d<65) return true;
        return false;
    }
}



class Num{
    constructor(x,y,number){
        this.x=x;
        this.y=y;
        this.number = number
    }
    draw(ctx){
        ctx.save();
        var n = T;
        ctx.translate(this.x,this.y+Math.sin(n/1000)*20);
        ctx.fillStyle="#977207";
        ctx.shadowBlur=canvas.height*0.03;
        ctx.shadowColor="#fff";
        ctx.fillText(this.number,0,0)
        ctx.restore();


    }
}

class showBubble{
    constructor(text,x,y,time,nokey){
        this.nokey=nokey;
        this.time=time;
        var speech=document.createElement("div");
        speech.className="bubble";
        speech.style.left=x*SCALE/SCALE2+"px";
        speech.style.top=y*SCALE/SCALE2+"px";
        speech.innerHTML=text;
        this.speech=speech;
    }
    show(){
        document.body.appendChild(this.speech);
        return new Promise((r)=>{
            var f=()=>{
                clearTimeout(timer);
                document.removeEventListener('keydown',f);
                document.removeEventListener('click',f);
                document.body.removeChild(this.speech);
                r();
            }
            if(!this.nokey) document.addEventListener('keydown',f);
            if(!this.nokey) document.addEventListener('click',f);
            var timer=setTimeout(f,this.time);

        });

    }
}


const MAP = [99,0,1,100,0,99,100,1,0,0,1.1,100,0,0,100,1,35,89,64,1,35,97,40,2,35,78,5,11,50,75,5,14,65,78,5,11,80,75,19,14,0.6,83.35,19,2,6.6,75.35,4,8,18.5,92,6.5,7,0,68,32,2.1,30,50,2,19,39.7,60.85,9.25,1.3,56.9,63.5,5.3,1.3,72.75,63.5,5.3,1.3,1,40.2,82,2.15,84.65,63.5,4,1.3,84.65,54.25,4,1.3,84.65,45,4,1.3,84.65,35.7,4,1.3,52,42,31,13,10.6,50,19.4,2,35,10,64,2,55,25,5,15.2,46.85,28.45,8.7,2,35,33.05,5,7.15,20.1,25,4.9,15.2,6.6,30.45,6.6,9.8,10,18,4.55,2,21.15,13.85,7,2,16.45,59.55,14,2,0.95,61.5,7,7.3,60,28,18,5.05,31.75,51.6,5.3,10.6]
const SPIKES = [40,87,10,2,55,87,10,2,70,87,10,2,40,38,5,2.2,25,38,10,2.2,1.05,81.35,5.5,2,13.25,38.35,6.9,1.85,1.05,38.35,5.55,1.85];
const SPIDERS = [66,55,20.4,52,55,15,64,12,13.15,41.35,42.35,31.75,92.95,11.9,54.25,37.05,11.9,18.5,29.1,70.1,25.15];
const NUMBERS = [0,26.45,55.55,0,51.6,37.05,2,62.2,37.05];
const WINDOWS = [91.3,92.6,66.15,92.6,48.95,92.6,17.2,78.05,26.45,78.05,43.65,70.1,58.2,70.1,74.1,70.1,92.6,70.1,92.6,54.25,92.6,37.05,72.75,21.15,56.9,21.15,43.65,21.15,9.25,25.15,47.6,5.3,60.85,5.3,74.1,5.3,13.25,92.6];
class Level{
    constructor(ctx){
        this.ctx=ctx;

        this.map = new Map(this.ctx);
        this.player = new Player(1800,1800,this.map);
        this.light = new Light(1600,1900);
        //this.player = new Player(1400,100,this.map);
        //this.light = new Light(1600,100);

        this.keyStates = new KeyStates;
        this.particles = new Particles;
        this.lastTime=T;
        this.badFrame=0;
        this.started=false;
        this.numbersCollected = 0;
        document.addEventListener("mousedown",(e)=>{
            if(e.buttons===1 && this.started){
                twinkle();
                this.light.setTarget(e.clientX*SCALE2/SCALE+this.map.offset[0],e.clientY*SCALE2/SCALE+this.map.offset[1]);
            }
        });

        setTimeout(()=>{
            var pp=[this.player.bound.x-this.map.targetOffset[0],this.player.bound.y-this.map.targetOffset[1]-100];
            var lp=[this.light.x-this.map.targetOffset[0],this.light.y-this.map.targetOffset[1]-50];
            var opening=[
                [lp,"Greetings strange soul, I am Ellysias, a Ferry God. You seem out of place in this realm - may I ask your business?"],
                [pp,"I'm Johnny. I was battling an ancient witch in my home realm of Jar when she cast some kind of spell and I found myself here."],
                [lp,"I may be able to help. It would seem you have fallen foul of the lost page of the Necronomicon - Page 404 - containing the curse of the Shadow Walker."],
                [lp,"To break the curse and be restored to your former self and realm, you must find the three sacred numbers and read them aloud."],
                [lp,"I will help guide you with my fairy light. Just point where you wish me to go and I will light your path [mouse]"],
                [lp,"You can navigate this place with your legs [keyboard A, D]"],
                [pp,"um..I did already know how to walk, but thank your for your kind assistance."]
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
        },1000);
        this.loop();
    }
    reset(){
        dead();
        this.map.light=true;
        setTimeout(()=>{
            overlay.className="show";
            this.player.bound.x=10000;
        },500);
        setTimeout(()=>{
            this.map = new Map(this.ctx);
            this.player = new Player(1800,1800,this.map);
            this.light = new Light(1600,1900);
            overlay.className="show";
        },1000);
        setTimeout(()=>{
            overlay.className="";
            this.started=true;
            hud.innerHTML='X X X';
        },2000)
    }
    loop(){
        T = performance.now();
        var ctx=this.ctx;
        ctx.save();
        ctx.scale(SCALE,SCALE);
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
        this.player.man.mag=Math.min(0.85,Math.abs(speed)/10*0.5+0.5);

        this.map.checkCollitions(this.player,this.light);
        var time = T;
        if(time-this.lastTime>15){
            this.badFrame++;
            if(this.badFrame>20) DOSHADOWS=false;
        }else{
            this.badFrame=Math.max(this.badFrame-1,0);
        }
        var dt=Math.max(0.5,Math.min(1,(time - this.lastTime)/15)); 
        this.lastTime = time;
        this.light.tick(0.55*dt);
        this.particles.tick(0.015*dt);
        this.player.tick(0.55*dt,this.map.boxes);

        this.map.setCenter(this.player.bound);
        ctx.save();
        this.map.setTranslation(ctx,0.55*dt);

        
        
        this.map.drawWithShadows(ctx,this.light, this.player);
        this.light.draw(ctx);

        if(this.player.isDead()){
            this.reset();
        }

        ctx.restore();
        ctx.save();
        this.map.setTranslation(ctx,0);

        this.particles.draw(ctx,this.map.offset,this.map.viewport);
        ctx.restore();

        
        var pos = this.player.bound;
        var dx = pos.x-50;
        var dy=pos.y-1850;
        var d=Math.sqrt(dx*dx+dy*dy);
        
        if(!this.coiled && d<200){
            this.coiled=true;
            var p=[200-this.map.targetOffset[0],1800-this.map.targetOffset[1]];
            var s = (document.monetization && document.monetization.state=="started")?
            "I'm the great mage Coil. I will grant you the ability to see your desire within the shadows":
            "I'm the great mage <a href=\"https://coil.com/\" target=\"_blank\">Coil</a>, cross my hands with silver and I will let you see your desire within the shadows.";
            (new showBubble(s,p[0],p[1],7500,true)).show();
        }

        

        var dx = pos.x-1850;
        var dy=pos.y-100;
        var d=Math.sqrt(dx*dx+dy*dy);
        var gameover=false;
        if(d<100 && this.player.numbersCollected==5){
            overlay.className="show";
            endmessage.className="show";
            gameover=true;
        } 



        ctx.restore();
        if(!gameover) requestAnimationFrame(this.loop.bind(this));
    }
}


var brick,bricksd,bricksl,bricksp,platform,hud,overlay,endmessage,SCALE=1,SCALE2=1,canvas,ctx;
//document.monetization={state:"started"}
var resize=()=>{
    SCALE2=512/Math.min(innerWidth,innerHeight);
    canvas.width=Math.max(innerWidth,innerHeight)*SCALE2;
    canvas.height=Math.min(innerWidth,innerHeight)*SCALE2;
    ctx.font = "bold "+(60*SCALE2)+"px Arial";
}
window.onresize = resize
setTimeout(()=>{
    hud=document.querySelector("#hud");
    overlay=document.querySelector("#overlay");
    endmessage=document.querySelector("#endMessage");
    canvas=document.querySelector("canvas");
    ctx=canvas.getContext("2d");
    brick = ctx.createPattern(brickT(0.7,0.5), 'repeat');
    bricksd = ctx.createPattern(brickT(0.5,0.4), 'repeat');
    bricksl = ctx.createPattern(brickT(0.5,0.7), 'repeat');
    bricksp = ctx.createPattern(brickT(1,0.4), 'repeat');
    resize();

    var particles = new Particles();
    particles.width=innerWidth;
    particles.height=innerHeight;
    var title=true;
    var Spider1 = new Spider(0,0,0);
    var Spider2 = new Spider(0,0,0);
    var spiderScale=1.5;
    var size = [particles.width,particles.height];
    var offset=[0,0];
    var anim=()=>{
        if(title){
            T = performance.now();
            var inset=0.1*canvas.width;
            Spider1.height = canvas.height/SCALE*0.8/spiderScale;
            Spider2.height = canvas.height/SCALE*0.8/spiderScale;
            Spider2.x = (canvas.width/SCALE-inset)/spiderScale;
            Spider1.x = inset/spiderScale;
            ctx.save();
            ctx.scale(SCALE,SCALE);
            ctx.fillStyle=bricksd;
            ctx.fillRect(0,0,canvas.width/SCALE,canvas.height/SCALE);
            ctx.fillStyle=brick;
            particles.tick(0.01);
            particles.draw(ctx,offset,size);
            ctx.fillRect(0,canvas.height/SCALE*0.9,canvas.width/SCALE,canvas.height/SCALE);
            ctx.fillStyle=bricksp;
            if(DOSHADOWS){
                ctx.shadowBlur=canvas.height*0.03;
                ctx.shadowColor="#000";
            }
            ctx.save();
            ctx.translate(0,canvas.height/SCALE*0.9);
            ctx.fillRect(0,0,canvas.width/SCALE,canvas.height*0.03);
            ctx.restore();
            ctx.scale(spiderScale,spiderScale);
            ctx.fillStyle="#000";
            Spider1.draw(ctx);
            Spider2.draw(ctx);
            ctx.restore();
            requestAnimationFrame(anim);
        }
    };
    anim();
    document.querySelector("b").onclick=()=>{
        
        overlay.className="show";
        setTimeout(()=>{
            overlay.className="";
            document.querySelector("main").style.display="none";
            document.querySelector("#hud").style.display="block";
            title=false;
            var level = new Level(ctx);
            if (!document.fullscreenElement) {
                document.body.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        },1500)
    }
})
