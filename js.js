class Asteroid {
    constructor(x, y, mx, my, radius = Math.floor(Math.random() * 40) + 5) {
        this.rotationSpeed = Math.floor(Math.random() * 5) - 2.5;
        this.x = x;
        this.y = y;
        this.mx = mx;
        this.my = my;
        this.points = [];
        this.collor = "white";
        this.currentSpeed = Math.sqrt(this.mx * this.mx + this.my * this.my);
        this.radius = radius;
        this.generatePoints(0);
        this.frames = 0;
    }

    generatePoints() {
        for (let i = 0; i < 360; i += Math.floor(Math.random() * 20 + 20)) {
            let rad = i * Math.PI / 180;
            let pointRadius = Math.floor(Math.random() * this.radius / 1 - this.radius / 2) + this.radius;
            this.points.push({ radius: pointRadius, angle: i });
        }
    }

}



class SpaceShit {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 0.05;
        this.mx = 0;
        this.my = 0;
        this.angle = 180;
        this.drag = 0.025;
        this.turn = 2;
        this.points = [];

        this.keyW = false;
        this.keyS = false;
        this.keyD = false;
        this.keyA = false;

        this.thrust = new Audio("thrust.wav");

        document.addEventListener("keydown", event => {
            if (event.keyCode === 65) {
                this.keyA = true;
            }
            if (event.keyCode === 68) {
                this.keyD = true;
            }
            if (event.keyCode === 87) {
                this.keyW = true;
            }
        });

        document.addEventListener("keyup", event => {
            if (event.keyCode === 65) {
                this.keyA = false;
            }
            if (event.keyCode === 68) {
                this.keyD = false;
            }
            if (event.keyCode === 87) {
                this.keyW = false;
            }
        });

    }

    update() {
        this.move();
        this.rotate();
        this.updatePoints();
    }

    updatePoints() {
        this.points = [];
        let rad = this.angle * Math.PI / 180;
        let p1 = { x: Math.sin(rad) * 50 + this.x, y: Math.cos(rad) * 50 + this.y };

        let rad2 = (this.angle + 135) * Math.PI / 180;
        let rad3 = (this.angle - 135) * Math.PI / 180;

        let p2 = { x: Math.sin(rad2) * 15 + this.x, y: Math.cos(rad2) * 15 + this.y };
        let p3 = { x: Math.sin(rad3) * 15 + this.x, y: Math.cos(rad3) * 15 + this.y };
        this.points.push(p1, p2, p3);
    }

    move() {
        let sX = Math.sign(this.mx);
        let sY = Math.sign(this.my);

        this.mx = (Math.abs(this.mx) - this.drag) * sX;
        this.my = (Math.abs(this.my) - this.drag) * sY;

        if (this.keyW) {
            this.thrust.play();
            let rad = this.angle * Math.PI / 180;
            let sin = Math.sin(rad) * 2;
            let cos = Math.cos(rad) * 2;
            this.mx += sin * this.speed;
            this.my += cos * this.speed;
        }

        this.x += this.mx;
        this.y += this.my;

        if (this.x < -50) {
            this.x = window.innerWidth + 50;
        }
        if (this.x > window.innerWidth + 50) {
            this.x = -50;
        }
        if (this.y > window.innerHeight + 50) {
            this.y = -50;
        }
        if (this.y < -50) {
            this.y = window.innerHeight + 50;
        }
    }

    rotate() {
        if (this.keyD) {
            this.angle -= this.turn;
        }
        if (this.keyA) {
            this.angle += this.turn;
        }
    }

}



class GameAutoController {
    constructor() {
        this.asteroids = [];

        this.canvas = document.createElement('canvas');
        this.canvas.id = "canvas";
        this.canvas.width = screen.width;
        this.canvas.height = screen.height;
        this.canvas.style.zIndex = 8;
        this.canvas.style.position = "absolute";
        this.canvas.style.border = "2px solid black";
        document.body.appendChild(this.canvas);
        this.bulletSpeed = 10;

        this.alive = true;

        this.turned = 0;

        this.spaceShit = new SpaceShit(this.canvas.width / 2, this.canvas.height / 2);
        this.spaceShit.update();

        this.ctx = this.canvas.getContext("2d");
        this.genetrateAsteroids(Math.random() * 20);


        this.bullets = [];
        document.addEventListener("keydown", event => {
            if (event.keyCode === 32) {
                let audio = new Audio("fire.wav");
                audio.play();
                this.bullets.push({ x: this.spaceShit.x, y: this.spaceShit.y, angle: this.spaceShit.angle });
            }

        });


        requestAnimationFrame(() => this.update());
    }

    update() {
        if (this.alive) {
            this.draw(false);
            this.spaceShit.update();
            this.move();
            this.rotate();
            this.collisions();
            this.removeOutside();
            this.checkBullets();
            this.checkSpaseShitCollisions();

            this.draw(true);
        } else {
            document.getElementById("dead").style.display = "block";
        }


        requestAnimationFrame(() => this.update());
    }



    checkBullets() {
        this.bullets.forEach(bullet => {
            let rad = bullet.angle * Math.PI / 180;
            let sin = Math.sin(rad) * this.bulletSpeed;
            let cos = Math.cos(rad) * this.bulletSpeed;
            bullet.x += sin;
            bullet.y += cos;
        });

        this.bullets.forEach(bullet => {
            let x2 = bullet.x + Math.sin(bullet.angle * Math.PI / 180) * 10;
            let y2 = bullet.y + Math.cos(bullet.angle * Math.PI / 180) * 10;
            this.asteroids.forEach(asteroid => {
                if (Math.sqrt((asteroid.x - bullet.x) * (asteroid.x - bullet.x) + (asteroid.y - bullet.y) * (asteroid.y - bullet.y)) < 200) {
                    let lines = this.getLines(asteroid);
                    lines.forEach(line => {
                        if (this.twoLineIntersectionPoint(bullet.x, bullet.y, x2, y2, line.x1, line.y1, line.x2, line.y2).intersect) {
                            this.bullets.splice(this.bullets.indexOf(bullet), 1);
                            this.breakAsteroid(asteroid);
                        }
                    });
                }
            });
        });
    }


    breakAsteroid(a) {
        let audio = new Audio("bangSmall.wav");
        audio.play();

        let totalPieceAmount = 2;
        let angleAdd = 360 / totalPieceAmount;

        for (let angle = 0; angle < 360; angle += angleAdd) {
            let asteroidRadius = a.radius / totalPieceAmount + Math.random();
            if (asteroidRadius > 8) {
                let rad = angle * Math.PI / 180;
                let mx = Math.sin(rad) + Math.random();
                let my = Math.cos(rad) + Math.random();
                let x = a.x + mx * asteroidRadius * 1;
                let y = a.y + my * asteroidRadius * 1;
                this.asteroids.push(new Asteroid(x, y, mx, my, asteroidRadius));
            }
        }

        this.asteroids.splice(this.asteroids.indexOf(a), 1);
        //le.log(this.asteroids.length);
    }



    checkSpaseShitCollisions() {
        let lines = this.getSpaceShitLines();
        this.asteroids.forEach(asteroid => {
            if (Math.sqrt((asteroid.x - this.spaceShit.x) * (asteroid.x - this.spaceShit.x) + (asteroid.y - this.spaceShit.y) * (asteroid.y - this.spaceShit.y)) < 120) {
                let asteroidLines = this.getLines(asteroid);
                lines.forEach(line => {
                    asteroidLines.forEach(aLine => {
                        if (this.twoLineIntersectionPoint(line.x1, line.y1, line.x2, line.y2, aLine.x1, aLine.y1, aLine.x2, aLine.y2).intersect && this.alive) {
                            let audio = new Audio("bangMedium.wav");
                            audio.play();
                            this.alive = false;
                        }
                    });
                });
            }
        });

    }

    getSpaceShitLines() {
        let lines = [];

        lines.push({ x1: this.spaceShit.points[0].x, y1: this.spaceShit.points[0].y, x2: this.spaceShit.points[2].x, y2: this.spaceShit.points[2].y });
        lines.push({ x1: this.spaceShit.points[0].x, y1: this.spaceShit.points[0].y, x2: this.spaceShit.points[1].x, y2: this.spaceShit.points[1].y });
        lines.push({ x1: this.spaceShit.points[1].x, y1: this.spaceShit.points[1].y, x2: this.spaceShit.points[2].x, y2: this.spaceShit.points[2].y });

        return lines;
    }


    ////////////////////////////////////////////PI-ta-boba tetoema/////////////////////////////////////
    collisions() {
        this.asteroids.forEach(asteroid => {
            let lines1 = null;
            this.asteroids.forEach(asteroid2 => {
                /////////////////////////////////////
                if (!(asteroid.x == asteroid2.x && asteroid.y == asteroid2.y) && Math.sqrt((asteroid2.x - asteroid.x) * (asteroid2.x - asteroid.x) + (asteroid2.y - asteroid.y) * (asteroid2.y - asteroid.y)) < 120
                    && asteroid.frames >= 90 && asteroid2.frames >= 90) {
                    if (lines1 == null)
                        lines1 = this.getLines(asteroid);
                    let lines2 = this.getLines(asteroid2);
                    lines1.forEach(lineA => {
                        lines2.forEach(lineB => {
                            if (this.twoLineIntersectionPoint(lineA.x1, lineA.y1, lineA.x2, lineA.y2,
                                lineB.x1, lineB.y1, lineB.x2, lineB.y2
                            ).intersect) {
                                asteroid.collor = "red";
                                asteroid2.collor = "red";

                                this.breakAsteroids(asteroid, asteroid2);
                            }
                        });
                    })
                }
                ///////////////////////////
            });
        });
    }

    breakAsteroids(a1, a2) {
        let totalRadius = a1.radius + a2.radius;
        let totalPieceAmount = Math.floor(Math.random() * 3) + 2;
        let angleAdd = 360 / totalPieceAmount;

        for (let angle = 0; angle < 360; angle += angleAdd) {
            let asteroidRadius = totalRadius / totalPieceAmount + Math.random();
            if (asteroidRadius > 8) {
                let rad = angle * Math.PI / 180;
                let mx = Math.sin(rad) + Math.random();
                let my = Math.cos(rad) + Math.random();
                let x = a1.x + mx * asteroidRadius * 1;
                let y = a1.y + my * asteroidRadius * 1;
                this.asteroids.push(new Asteroid(x, y, mx, my, asteroidRadius));
            }
        }

        this.asteroids.splice(this.asteroids.indexOf(a1), 1);
        this.asteroids.splice(this.asteroids.indexOf(a2), 1);
        //le.log(this.asteroids.length);
    }


    getLines(asteroid) {

        let p1 = this.giveXandYformPoint(asteroid.points[0]);
        let p2 = this.giveXandYformPoint(asteroid.points[asteroid.points.length - 1]);

        let lines = [];
        lines.push({ x1: p1.x + asteroid.x, x2: p2.x + asteroid.x, y1: p1.y + asteroid.y, y2: p2.y + asteroid.y });



        for (let i = 0; i < asteroid.points.length - 1; i++) {
            let pI = this.giveXandYformPoint(asteroid.points[i]);
            let pI1 = this.giveXandYformPoint(asteroid.points[i + 1]);

            lines.push({ x1: pI.x + asteroid.x, x2: pI1.x + asteroid.x, y1: pI.y + asteroid.y, y2: pI1.y + asteroid.y });
        }
        return lines;
    }

    removeOutside() {
        this.asteroids = this.asteroids.filter(asteroid => {
            return !(asteroid.x < 0 - asteroid.radius * 2 || asteroid.x > window.innerWidth + asteroid.radius * 2 || asteroid.y < asteroid.radius * -2 || asteroid.y > window.innerWidth + asteroid.width * 2)
        })
    }


    rotate() {
        this.asteroids.forEach(asteroid => {
            asteroid.points.forEach(point => {
                point.angle += asteroid.rotationSpeed;
            });
        });
    }

    move() {
        this.asteroids.forEach(asteroid => {
            asteroid.x += asteroid.mx;
            asteroid.y += asteroid.my;
            asteroid.frames++;
        });
    }


    giveXandYformPoint(point) {
        let rad = point.angle * Math.PI / 180;

        let sin = Math.sin(rad) * point.radius;
        let cos = Math.cos(rad) * point.radius;
        return { x: sin, y: cos };
    }

    draw(draw) {
        this.asteroids.forEach(asteroid => {
            this.ctx.strokeStyle = "black";
            this.ctx.lineWidth = 4;

            if (draw) {
                this.ctx.strokeStyle = asteroid.collor;
                this.ctx.lineWidth = 1;
            } else {
                asteroid.points.forEach(point => {
                    let pX = this.giveXandYformPoint(point).x;
                    let pY = this.giveXandYformPoint(point).y;

                    this.ctx.beginPath();
                    this.ctx.arc(pX + asteroid.x, asteroid.y + pY, 5, 0, 2 * Math.PI);
                    this.ctx.fillStyle = "black";
                    this.ctx.fill();
                });
            }

            let pb = this.giveXandYformPoint(asteroid.points[0]);
            let pe = this.giveXandYformPoint(asteroid.points[asteroid.points.length - 1]);
            this.ctx.beginPath();
            this.ctx.moveTo(pb.x + asteroid.x, pb.y + asteroid.y);
            this.ctx.lineTo(pe.x + asteroid.x, pe.y + asteroid.y);
            this.ctx.stroke();

            for (let i = 0; i < asteroid.points.length - 1; i++) {

                let pointI = this.giveXandYformPoint(asteroid.points[i]);
                let pointI1 = this.giveXandYformPoint(asteroid.points[i + 1]);

                this.ctx.beginPath();
                this.ctx.moveTo(pointI.x + asteroid.x, pointI.y + asteroid.y);
                this.ctx.lineTo(pointI1.x + asteroid.x, pointI1.y + asteroid.y);
                this.ctx.stroke();
            }
            this.ctx.stroke();

        });

        //////////////////////////////SpaceShit/////////////////////////
        this.ctx.strokeStyle = "black";

        for (let i = 0; i < this.spaceShit.points.length; i++) {
            this.ctx.beginPath();
            this.ctx.arc(this.spaceShit.points[i].x, this.spaceShit.points[i].y, 5, 0, 2 * Math.PI);
            this.ctx.fillStyle = "black";
            this.ctx.fill();
        }

        if (draw) {
            this.ctx.strokeStyle = "lime";
        }
        this.ctx.beginPath();
        this.ctx.moveTo(this.spaceShit.points[0].x, this.spaceShit.points[0].y);
        this.ctx.lineTo(this.spaceShit.points[2].x, this.spaceShit.points[2].y);
        for (let i = 0; i < this.spaceShit.points.length - 1; i++) {
            this.ctx.moveTo(this.spaceShit.points[i].x, this.spaceShit.points[i].y);
            this.ctx.lineTo(this.spaceShit.points[i + 1].x, this.spaceShit.points[i + 1].y);
        }
        this.ctx.stroke();

        ////////////////////////////Bullets////////////////////
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 4;
        if (draw) {
            this.ctx.strokeStyle = "lime";
            this.ctx.lineWidth = 1;
        }

        this.bullets.forEach(bullet => {
            let x2 = bullet.x + Math.sin(bullet.angle * Math.PI / 180) * 10;
            let y2 = bullet.y + Math.cos(bullet.angle * Math.PI / 180) * 10;

            if (!draw) {
                this.ctx.beginPath();
                this.ctx.arc(bullet.x, bullet.y, 5, 0, 2 * Math.PI);
                this.ctx.arc(x2, y2, 5, 0, 2 * Math.PI);
                this.ctx.fillStyle = "black";
                this.ctx.fill();
            }

            this.ctx.beginPath();
            this.ctx.moveTo(bullet.x, bullet.y);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        });
    }

    genetrateAsteroids(count) {
        for (let i = 0; i < count; i++) {
            let side = Math.floor(Math.random() * 4);

            let x;
            let y;
            let mx;
            let my;



            if (side == 0) {
                x = -30;
                mx = Math.random();
                y = Math.random() * this.canvas.height;
                my = Math.random();
            }

            if (side == 1) {
                x = this.canvas.width + 30;
                mx = Math.random() * -1;
                y = Math.random() * this.canvas.height;
                my = Math.random();
            }

            if (side == 2) {
                y = -30;
                my = Math.random();
                x = Math.random() * this.canvas.width;
                mx = Math.random();
            }


            if (side == 3) {
                y = this.canvas.height + 30;
                my = Math.random() * -1;
                x = Math.random() * this.canvas.width;
                mx = Math.random();
            }

            this.asteroids.push(new Asteroid(x, y, mx, my));
        }

        setTimeout(() => {
            this.genetrateAsteroids(Math.random() * 20);
        }, 3000);

        /* this.asteroids.push(new Asteroid(0, 500, 1, 0));
         this.asteroids.push(new Asteroid(500, 500, -1, 0));*/
    }


    twoLineIntersectionPoint(l1x1, l1y1, l1x2, l1y2, l2x1, l2y1, l2x2, l2y2) {
        //https://en.wikipedia.org/wiki/Line–line_intersection

        let x1 = l1x1;
        let y1 = l1y1;
        let x2 = l1x2;
        let y2 = l1y2;
        let x3 = l2x1;
        let y3 = l2y1;
        let x4 = l2x2;
        let y4 = l2y2;

        let denominator = ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
        if (denominator == 0)
            return { x: 0, y: 0, intersect: false };

        let x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
            denominator;
        let y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
            denominator;

        let intersect =
            isBetween(x, l1x1, l1x2) &&
            isBetween(x, l2x1, l2x2) &&
            isBetween(y, l1y1, l1y2) &&
            isBetween(y, l2y1, l2y2);

        return { x: x, y: y, intersect: intersect };
    }
}


function start() {
    let game = new GameAutoController();
}


function isBetween(value, A, B) {
    return (A <= B && value >= A && value <= B) ||
        (A >= B && value >= B && value <= A);
}