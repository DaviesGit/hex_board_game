const PIECE_EMPTY = 'asset/piece_empty.png';
const PIECE_RED = 'asset/piece_red.png';
const PIECE_BLUE = 'asset/piece_blue.png';

const WHO_NONE = 0;
const WHO_RED = 1;
const WHO_BLUE = 2;

let currentMove = WHO_RED;
let theComputer = WHO_RED;
let theComputerLevel = 8;
let useComputer = true;
let isFirst = true;

let isStart = false;
let isOver = false;

let red_time = 0,
    blue_time = 0;

let red_time_start = 0,
    blue_time_start = 0;

// 计时的部分
//红色计时开始
function startRedTimeCount() {
    red_time_start = +new Date();
}
//红色计时结束
function endRedTimeCount() {
    red_time += (+new Date()) - red_time_start;
}
//蓝色计时开始
function startBlueTimeCount() {
    blue_time_start = +new Date();
}
//蓝色计时结束
function endBlueTimeCount() {
    blue_time += (+new Date()) - blue_time_start;
}

let timeCountId = -1;
// 计时的部分使用moment.js来格式化时间
//开始计时
function startTimeCount() {
    stopTimeCount();
    //显示的时间=游戏开始时记录下的时间A+现在结束当前回合的时间B-该回合开始时的时间C
    //每0.1秒显示一次
    timeCountId = setInterval(function () {
        red_time_span.innerHTML = moment.utc(WHO_RED === currentMove ? red_time + (+new Date()) - red_time_start : red_time).format('HH:mm:ss.S');
        blue_time_span.innerHTML = moment.utc(WHO_BLUE === currentMove ? blue_time + (+new Date()) - blue_time_start : blue_time).format('HH:mm:ss.S');
    }, 100);
}

//计时停止，红蓝时间归零
function stopTimeCount() {
    if (timeCountId >= 0)
        clearInterval(timeCountId);
    red_time = 0;
    blue_time = 0;
}


const PIECES = [PIECE_EMPTY, PIECE_RED, PIECE_BLUE];

//使标准化 辅助函数
function standardize(val) {
    val < 0 && (val = 0)
    val = Math.log10(val / 512 + 1) / Math.log10(4);
    return val > 1 ? 1 : val;
}

//AI状态图中每个的权值（即显示在界面上的那个
function to_hex(vv) {
    var hh = "0123456789ABCDEF";
    var nn = Math.floor(standardize(vv) * 255);
    nn = 255 - nn;
    return hh.charAt(Math.floor(nn / 16)) + hh.charAt(nn % 16);
}

layui.use(['jquery', 'layer'], function () {

    //棋盘上的每个棋子落下点
    function change_piece(i, j, type) {
        layui.$('#piece>div>img').get(j * 11 + i).src = type;
    }

    window.change_piece = change_piece;
    //AI图上的每个格子
    function change_pot(selector, i, j, value) {
        let ele = layui.$('#' + selector + '>div>.pot').eq(j * 11 + i);
        ele.attr('title', value);
        //.hexagon filter 属性
        layui.$('.hexagon', ele).css('filter', 'brightness(' + (1 - standardize(value)) + ')');
        layui.$('.val', ele).text(to_hex(value)); //text() 方法设置或返回被选元素的文本内容
    }
    window.change_pot = change_pot;

    //界面上的hex棋状态第二个方框 历史记录
    //运用数组，ii定位横排，jj定位竖排，判断红/蓝，动态添加
    function showHistory() {
        let red_flag = false;
        let history = layui.$('.history');
        history.html('');
        for (let i = 0; i < MoveCount; ++i) {
            let ii = History[i][0];
            let jj = History[i][1];
            if (red_flag = !red_flag) {
                history.append(layui.$('<div><span style="padding-left: 15px; color: red;">红子：</span><span>' + 'ABCDEFGHIJK'.charAt(ii) + (jj + 1) + '</span></div>'));
            } else {
                history.append(layui.$('<div><span style="padding-left: 15px; color: blue;">蓝子：</span><span>' + 'ABCDEFGHIJK'.charAt(ii) + (jj + 1) + '</span></div>'));
            }
        }
        history.get(0).scrollTop = history.get(0).scrollHeight;
    }
    window.showHistory = showHistory;

    // 获得/更新历史记录
    function updateBoardFromHistory() {
        let imgs = layui.$('#piece>div>img');
        imgs.attr('src', PIECE_EMPTY);

        let red_flag = false;
        for (let i = 0; i < MoveCount; ++i) {
            let ii = History[i][0];
            let jj = History[i][1];
            if (red_flag = !red_flag) {
                layui.$('#piece>div>img').get(jj * 11 + ii).src = PIECE_RED;
            } else {
                layui.$('#piece>div>img').get(jj * 11 + ii).src = PIECE_BLUE;
            }
        }
    }
    window.updateBoardFromHistory = updateBoardFromHistory;

});


//ai找到最佳下一步棋的算法
function getBestMove(who, theLevel) {
    let theCol = WHO_NONE === who ? 0 : WHO_RED === who ? -1 : 1;
    //WHO_RED === who ? -1 : 1 现在的是不是红色，是就返回-1，否则返回1
    //WHO_NONE === who 
    //thecol<0 red thecol>0 blue
    var ii, jj, kk, ii_b, jj_b, ff = 0,
        ii_q = 0,
        jj_q = 0,
        cc, pp0, pp1;
    vv = new Array();
    //游戏开始落下第一个棋的时候，ff的值就会是190/落子数的平方
    if (MoveCount > 0) ff = 190 / (MoveCount * MoveCount);
    mm = 20000; //权值
    //遍历整个棋盘
    //初始化的时候每个Fld[][]都是0，所以如果不是零则这个位置落子了
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++) {
            //如果落子了，ii是从零开始算的，所以要数行要加一，jj不用
            if (Fld[ii][jj] != 0) {
                ii_q += 2 * ii + 1 - Size; //第7行的第六个，ii为6，jj为6，ii_q=2
                jj_q += 2 * jj + 1 - Size; //jj_q=2
            } //由于有循环则在遍历的时候将所有落了子的地方经过上面的公式处理从而相加
            //但是上面的公式中倘若ii或jj的值<=5，ii_q或jj_q的值就会加0或减小
        }
    }
    //将ii_q jj_q转化  <0 -1 >0 1
    //一共size=11，在<=5的时候会减小或不变，>5的时候会增加
    //再进入sign函数中进行转换，则ii_q会转化成-1或1
    //c：通过转化来判断是上半部分落得子多还是下半部分落得子多
    //左半部分和右半部分同理
    ii_q = sign(ii_q);
    jj_q = sign(jj_q);
    //再次遍历棋盘
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++) {
            //倘若这个地方没有落子
            if (Fld[ii][jj] == 0) {
                //生成影响未来落子的一个辅助数，倘若选择的是等级十，则mmp的数就是准确的，未来落得子也是最佳的
                //倘若选择的是其他等级，mmp的值会相应设置误差，落得子也不一定是最佳的，从而降低难度
                mmp = Math.random() * (10 - theLevel) / 10 * 50; //第10级就是0
                //mmp = 0;
                //math.abs取绝对值
                //mmp加上的是，落子点和棋盘中心点的偏差值乘以落子数量的权值（190/落子数的平方，落得子越多，ff就越小）
                mmp += (Math.abs(ii - 5) + Math.abs(jj - 5)) * ff;
                //mmp再加上8 *（上半部分多/下半部分多 * 对应的与中心点的偏差值 （上下/左右 相加）/ 落子的次数+1
                //定位到四分之一的部分
                mmp += 8 * (ii_q * (ii - 5) + jj_q * (jj - 5)) / (MoveCount + 1);
                //如果选择的等级大于6
                if (theLevel > 6) {
                    //遍历
                    for (kk = 0; kk < 4; kk++)
                        //bridge 11*11*4
                        mmp -= Bridge[ii][jj][kk];
                }
                //pot[][][0]从0到10，实际上对应的是界面上从最下面一行到最上面一行的权值
                //pot[][][1]从0到10，对应的则是界面上从第一行到最后一行的权值
                //pot[][][3]就是对应的位置的权值
                //pot[][][2]就是整个棋盘反转之后对应的位置的权值
                pp0 = Pot[ii][jj][0] + Pot[ii][jj][1]; //对应的是离界面最中间那一行的距离相同的权值相加，每个位置的[0]+[1]的值是相同的
                pp1 = Pot[ii][jj][2] + Pot[ii][jj][3]; //当落子后，[][][3]就会从落子的位置开始的值变成刚好是下一个数的值（即比它小的那个数）
                mmp += pp0 + pp1;
                if ((pp0 <= 268) || (pp1 <= 268)) mmp -= 400; //140+128//意味着在最边边上的一行
                vv[ii * Size + jj] = mmp;
                if (mmp < mm) {
                    mm = mmp;
                    ii_b = ii;
                    jj_b = jj;
                }
            }
        }
    }
    if (theLevel > 4) {
        mm += 108;
        for (ii = 0; ii < Size; ii++) {
            for (jj = 0; jj < Size; jj++) {
                if (vv[ii * Size + jj] < mm) {
                    if (theCol < 0) //red
                    {
                        if ((ii > 3) && (ii < Size - 1) && (jj > 0) && (jj < 3)) {
                            if (Fld[ii - 1][jj + 2] == -theCol) {
                                cc = CanConnectFarBorder(ii - 1, jj + 2, -theCol);
                                if (cc < 2) {
                                    ii_b = ii;
                                    if (cc < -1) {
                                        ii_b--;
                                        cc++;
                                    }
                                    jj_b = jj - cc;
                                    mm = vv[ii * Size + jj];
                                }
                            }
                        }
                        if ((ii > 0) && (ii < Size - 1) && (jj == 0)) {
                            if ((Fld[ii - 1][jj + 2] == -theCol) &&
                                (Fld[ii - 1][jj] == 0) && (Fld[ii - 1][jj + 1] == 0) && (Fld[ii][jj + 1] == 0) && (Fld[ii + 1][jj] == 0)) {
                                ii_b = ii;
                                jj_b = jj;
                                mm = vv[ii * Size + jj];
                            }
                        }
                        if ((ii > 0) && (ii < Size - 4) && (jj < Size - 1) && (jj > Size - 4)) {
                            if (Fld[ii + 1][jj - 2] == -theCol) {
                                cc = CanConnectFarBorder(ii + 1, jj - 2, -theCol);
                                if (cc < 2) {
                                    ii_b = ii;
                                    if (cc < -1) {
                                        ii_b++;
                                        cc++;
                                    }
                                    jj_b = jj + cc;
                                    mm = vv[ii * Size + jj];
                                }
                            }
                        }
                        if ((ii > 0) && (ii < Size - 1) && (jj == Size - 1)) {
                            if ((Fld[ii + 1][jj - 2] == -theCol) &&
                                (Fld[ii + 1][jj] == 0) && (Fld[ii + 1][jj - 1] == 0) && (Fld[ii][jj - 1] == 0) && (Fld[ii - 1][jj] == 0)) {
                                ii_b = ii;
                                jj_b = jj;
                                mm = vv[ii * Size + jj];
                            }
                        }
                    } else { //blue
                        if ((jj > 3) && (jj < Size - 1) && (ii > 0) && (ii < 3)) {
                            if (Fld[ii + 2][jj - 1] == -theCol) {
                                cc = CanConnectFarBorder(ii + 2, jj - 1, -theCol);
                                if (cc < 2) {
                                    jj_b = jj;
                                    if (cc < -1) {
                                        jj_b--;
                                        cc++;
                                    }
                                    ii_b = ii - cc;
                                    mm = vv[ii * Size + jj];
                                }
                            }
                        }
                        if ((jj > 0) && (jj < Size - 1) && (ii == 0)) {
                            if ((Fld[ii + 2][jj - 1] == -theCol) &&
                                (Fld[ii][jj - 1] == 0) && (Fld[ii + 1][jj - 1] == 0) && (Fld[ii + 1][jj] == 0) && (Fld[ii][jj + 1] == 0)) {
                                ii_b = ii;
                                jj_b = jj;
                                mm = vv[ii * Size + jj];
                            }
                        }
                        if ((jj > 0) && (jj < Size - 4) && (ii < Size - 1) && (ii > Size - 4)) {
                            if (Fld[ii - 2][jj + 1] == -theCol) {
                                cc = CanConnectFarBorder(ii - 2, jj + 1, -theCol);
                                if (cc < 2) {
                                    jj_b = jj;
                                    if (cc < -1) {
                                        jj_b++;
                                        cc++;
                                    }
                                    ii_b = ii + cc;
                                    mm = vv[ii * Size + jj];
                                }
                            }
                        }
                        if ((jj > 0) && (jj < Size - 1) && (ii == Size - 1)) {
                            if ((Fld[ii - 2][jj + 1] == -theCol) &&
                                (Fld[ii][jj + 1] == 0) && (Fld[ii - 1][jj + 1] == 0) && (Fld[ii - 1][jj] == 0) && (Fld[ii][jj - 1] == 0)) {
                                ii_b = ii;
                                jj_b = jj;
                                mm = vv[ii * Size + jj];
                            }
                        }
                    }
                }
            }
        }
    }
    return [jj_b, ii_b];
    //    MakeMove(ii_b, jj_b, false);
    //    IsRunning = false;
    //    if (theCol < 0) {
    //        if ((Pot[ii_b][jj_b][2] > 140) || (Pot[ii_b][jj_b][3] > 140)) {
    //            GetPot(0);
    //            WritePot(false);
    //            return;
    //        }
    //        window.document.OptionsForm.Msg.value = " Red has won !";
    //        Blink(-2);
    //    } else {
    //        if ((Pot[ii_b][jj_b][0] > 140) || (Pot[ii_b][jj_b][1] > 140)) {
    //            GetPot(0);
    //            WritePot(false);
    //            return;
    //        }
    //        window.document.OptionsForm.Msg.value = " Blue has won !";
    //        Blink(-2);
    //    }
    //    IsOver = true;
}
//点击了之后移动的一些逻辑处理
function makeMove(who, ii, jj) {
    var iis = jj,
        jjs = ii;
    if (Fld[iis][jjs])
        return false;
    //    if (MoveCount == 1) {
    //        if (Fld[ii][jj] != 0) {
    //            Fld[ii][jj] = 0;
    //            //            RefreshPic(ii, jj);
    //            iis = jj;
    //            jjs = ii;
    //            IsSwap = 1;
    //        } else IsSwap = 0;
    //    }
    //    let ccol = ((MoveCount + 1 + Start0) % 2) * 2 - 1;
    //    Fld[iis][jjs] = ccol;
    Fld[iis][jjs] = WHO_NONE === who ? 0 : WHO_RED === who ? -1 : 1;
    //    RefreshPic(iis, jjs);
    //更新总移动步数
    if (History[MoveCount][0] != ii) {
        History[MoveCount][0] = ii;
        MaxMoveCount = MoveCount + 1;
    }
    if (History[MoveCount][1] != jj) {
        History[MoveCount][1] = jj;
        MaxMoveCount = MoveCount + 1;
    }
    MoveCount++;
    if (MaxMoveCount < MoveCount)
        MaxMoveCount = MoveCount;
    change_piece(ii, jj, PIECES[who]); //显示棋子图片
    updatePot(theComputerLevel); //getpot 获得棋子位置
    setTimeout(function () {
        showPot();
    }, 0);
    return MoveCount;
}



let graph;
function updatePot(level) {

    var map={};
    
    for (ii = 0; ii < Size; ii++) {
        map[''+Fld[ii][0]]={};
        for (jj = 0; jj < Size; jj++) {
            if (Fld[ii][0] == 0) map[''+Fld[ii][0]][''+Fld[jj][0]]=128; //blue border
            else {
                if (Fld[ii][0] > 0) map[''+Fld[ii][0]][''+Fld[jj][0]]=0; //如果是自己的棋子 将其路径长度设置为0
            }
        }
    }
    graph=new dijkstra(map);
    
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++) {
            Pot[ii][jj][0]=graph.findShortestPath(''+Fld[ii][0],''+Fld[jj][0]);
        }
    }

    return GetPot(level);
}


//显示ai状态图
function showPot() {
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++) {
            //change_pot的输入的最后一个参数就是界面上的值
            //red;
            change_pot('piece_pot0', jj, ii, Pot[ii][jj][2]);
            change_pot('piece_pot1', jj, ii, Pot[ii][jj][3]);
            change_pot('piece_pot2', jj, ii, (Pot[ii][jj][2] + Pot[ii][jj][3]) / 2);
            //blue;
            change_pot('piece_pot3', jj, ii, Pot[ii][jj][0]);
            change_pot('piece_pot4', jj, ii, Pot[ii][jj][1]);
            change_pot('piece_pot5', jj, ii, (Pot[ii][jj][0] + Pot[ii][jj][1]) / 2);
        }
    }
}
//判断赢的是哪个颜色
function whoWin(jj, ii) {
    if ((Pot[ii][jj][2] <= 0) && (Pot[ii][jj][3] <= 0)) {
        return WHO_RED; //red;
    } else if ((Pot[ii][jj][0] <= 0) && (Pot[ii][jj][1] <= 0)) {
        return WHO_BLUE; //blue;
    }
    return WHO_NONE; //none;
}


//dijkstra算法
var dijkstra = (function (undefined) {

	var extractKeys = function (obj) {
		var keys = [], key;
		for (key in obj) {
		    Object.prototype.hasOwnProperty.call(obj,key) && keys.push(key);
		}
		return keys;
	}

	var sorter = function (a, b) {
		return parseFloat (a) - parseFloat (b);
	}

	var findPaths = function (map, start, end, infinity) {
		infinity = infinity || Infinity;

		var costs = {},
		    open = {'0': [start]},
		    predecessors = {},
		    keys;

		var addToOpen = function (cost, vertex) {
			var key = "" + cost;
			if (!open[key]) open[key] = [];
			open[key].push(vertex);
		}

		costs[start] = 0;

		while (open) {
			if(!(keys = extractKeys(open)).length) break;

			keys.sort(sorter);

			var key = keys[0],
			    bucket = open[key],
			    node = bucket.shift(),
			    currentCost = parseFloat(key),
			    adjacentNodes = map[node] || {};

			if (!bucket.length) delete open[key];

			for (var vertex in adjacentNodes) {
			    if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
					var cost = adjacentNodes[vertex],
					    totalCost = cost + currentCost,
					    vertexCost = costs[vertex];

					if ((vertexCost === undefined) || (vertexCost > totalCost)) {
						costs[vertex] = totalCost;
						addToOpen(totalCost, vertex);
						predecessors[vertex] = node;
					}
				}
			}
		}

		if (costs[end] === undefined) {
			return null;
		} else {
			return predecessors;
		}

	}

	var extractShortest = function (predecessors, end) {
		var nodes = [],
		    u = end;

		while (u !== undefined) {
			nodes.push(u);
			u = predecessors[u];
		}

		nodes.reverse();
		return nodes;
	}

	var findShortestPath = function (map, nodes) {
		var start = nodes.shift(),
		    end,
		    predecessors,
		    path = [],
		    shortest;

		while (nodes.length) {
			end = nodes.shift();
			predecessors = findPaths(map, start, end);

			if (predecessors) {
				shortest = extractShortest(predecessors, end);
				if (nodes.length) {
					path.push.apply(path, shortest.slice(0, -1));
				} else {
					return path.concat(shortest);
				}
			} else {
				return null;
			}

			start = end;
		}
	}

	var toArray = function (list, offset) {
		try {
			return Array.prototype.slice.call(list, offset);
		} catch (e) {
			var a = [];
			for (var i = offset || 0, l = list.length; i < l; ++i) {
				a.push(list[i]);
			}
			return a;
		}
	}

	var dijkstra = function (map) {
		this.map = map;
	}

	dijkstra.prototype.findShortestPath = function (start, end) {
		if (Object.prototype.toString.call(start) === '[object Array]') {
			return findShortestPath(this.map, start);
		} else if (arguments.length === 2) {
			return findShortestPath(this.map, [start, end]);
		} else {
			return findShortestPath(this.map, toArray(arguments));
		}
	}

	dijkstra.findShortestPath = function (map, start, end) {
		if (Object.prototype.toString.call(start) === '[object Array]') {
			return findShortestPath(map, start);
		} else if (arguments.length === 3) {
			return findShortestPath(map, [start, end]);
		} else {
			return findShortestPath(map, toArray(arguments, 1));
		}
	}

	return dijkstra;

})();



//下一次移动的行为
function nextMove() {
    //结束上一个运行的时间，开启另一个的时间
    if (WHO_RED === currentMove) {
        endRedTimeCount();
        startBlueTimeCount();
    }
    if (WHO_BLUE === currentMove) {
        endBlueTimeCount();
        startRedTimeCount();
    }
    total_steps.innerHTML = MoveCount;
    currentMove = WHO_RED === currentMove ? WHO_BLUE : WHO_RED;
    who.innerHTML = WHO_RED === currentMove ? '红子' : '蓝子';
    showHistory();
}

//轮到电脑下棋的回合
function notifyComputerMove() {
    if (currentMove !== theComputer)
        return false;
    let point = getBestMove(theComputer, theComputerLevel); //返回两个数
    makeMove(currentMove, point[0], point[1]); //makeMove(who, ii, jj) 
    nextMove();
    showWinner(point[0], point[1]);
}

//一方胜利 游戏结束 的弹窗
function showWinner(i, j) {
    let win = whoWin(i, j);
    if (WHO_NONE === win)
        return false;
    isOver = true;

    blink();
    if (useComputer) {
        let index = layer.confirm(win === theComputer ? '哈哈，你输了！！' : '厉害呀，我的哥！！', {
            btn: [win === theComputer ? '我不服' : '哈哈哈', win === theComputer ? '好吧' : '哈哈'] //按钮
        }, function () {
            layer.msg(win === theComputer ? '不服再来！' : '恭喜，恭喜！', {
                icon: 1
            });
            layer.close(index);
        }, function () {
            layer.msg(win === theComputer ? '加油，不要放弃哦！' : '再接再厉！', {
                icon: 1
            });
            layer.close(index);
        });
    } else {
        let index = layer.confirm(WHO_RED === win ? '红方胜利！' : '蓝方胜利！', {
            btn: ['好的', '取消'] //按钮
        }, function () {
            layer.close(index);
        }, function () {
            layer.close(index);
        });
    }

    stopTimeCount();
    return true;
}

function blink() {
    for (ii = 0; ii < Size; ii++)
        for (jj = 0; jj < Size; jj++)
            if ((Pot[ii][jj][0] + Pot[ii][jj][1] <= 0) || (Pot[ii][jj][2] + Pot[ii][jj][3] <= 0)) {
                let index = ii * 11 + jj;
                layui.$('#piece>div>img').eq(index).addClass('blink');
            }
}

//初始化整个游戏
function init() {
    var ii, jj;
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++)
            Fld[ii][jj] = 0;
    }
    updatePot(theComputerLevel);
    //显示ai状态图
    setTimeout(function () {
        showPot();
    }, 0);

    isStart = false;
    isOver = false;

    Start0 = true;
    MoveCount = 0;
    MaxMoveCount = 0;

    who.innerHTML = '未开始';
    total_steps.innerHTML = 0;

    red_time_span.innerHTML = 0;
    blue_time_span.innerHTML = 0;

    layui.$('.history').html('');

    currentMove = WHO_RED;
    //    computerLevel = 8;
    red_time = 0;
    blue_time = 0;

    layui.$('#piece>div>img.blink').removeClass('blink');

    updateBoardFromHistory();
}

//开始游戏
function start() {
    init();
    isStart = true;
    theComputer = isFirst ? WHO_BLUE : WHO_RED;
    if (!isFirst && useComputer)
        setTimeout(notifyComputerMove, 500);
    //开始全部的计时
    startRedTimeCount();
    startBlueTimeCount();
    startTimeCount();
}
