var loader = {
    loop:undefined,
    color: "rgb(20,200,200)",
    doFrame: () => {
        const canvas = document.getElementById("loader");
        const c = canvas.getContext('2d');
        const time = new Date().getTime();

        c.clearRect(0,0,200,200);
        c.beginPath();
        c.lineWidth = 15;
        c.lineCap = 'round';
        c.strokeStyle = loader.color;
        const startA = (Math.sin(time/500)+1)*(Math.PI/4)+((time/400)%(Math.PI*2));
        const totalAngle = startA+(Math.cos(time/500)+1.6)*Math.PI/6
        c.arc(100,100,85,startA,totalAngle);
        c.stroke();
    },
    start:() => {
        document.getElementById("loadingText").style.display = "opacity(1)";
        document.getElementById("loader").style.filter = "opacity(1)";
        loader.loop = setInterval(loader.doFrame,30);
    },
    stop:()=> {  
        document.getElementById("loadingText").style.filter = "opacity(0)";
        document.getElementById("loader").style.filter = "opacity(0)";
        setTimeout(()=> {
            clearInterval(loader.loop);
            document.getElementById("loader").getContext('2d').clearRect(0,0,200,200);
        },500);
         
    }
}
