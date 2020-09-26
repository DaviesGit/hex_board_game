var i, j, k, IsOver = true,
    IsStart0, Start, Start0, Size = 11,
    IsRunning = false,
    LastEvent = "";
var MoveCount = 0,
    MaxMoveCount, MaxFld = Size * Size,
    IsSwap, ActiveColor = 0;
IsPlayer = new Array(2);
Level = new Array(2);
ImgNum = new Array(Size);
for (i = 0; i < Size; i++)
    ImgNum[i] = new Array(Size);
Fld = new Array(Size);
for (i = 0; i < Size; i++)
    Fld[i] = new Array(Size);
Pot = new Array(Size);
for (i = 0; i < Size; i++)
    Pot[i] = new Array(Size);
for (i = 0; i < Size; i++) {
    for (j = 0; j < Size; j++)
        Pot[i][j] = new Array(4);
}
Bridge = new Array(Size);
for (i = 0; i < Size; i++)
    Bridge[i] = new Array(Size);
for (i = 0; i < Size; i++) {
    for (j = 0; j < Size; j++)
        Bridge[i][j] = new Array(4);
}
Upd = new Array(Size);
for (i = 0; i < Size; i++)
    Upd[i] = new Array(Size);
History = new Array(MaxFld + 1);
for (i = 0; i < MaxFld + 1; i++)
    History[i] = new Array(2);
Pic = new Array(3);
Pic[0] = new Image();
Pic[0].src = "Hex_files/hex_r.gif";
Pic[1] = new Image();
Pic[1].src = "Hex_files/hex_t.gif";
Pic[2] = new Image();
Pic[2].src = "Hex_files/hex_b.gif";

IsStart0 = true;
IsPlayer[0] = false;
IsPlayer[1] = false;
Level[0] = 3;
Level[1] = 3;
//初始化界面
function Init() {
    //倘若当时的状态是游戏中，则将下一个状态设置成初始化
    if (IsRunning) {
        LastEvent = "Init()";
        return;
    }
    var ii, jj;
    //初始化整个棋盘
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++)
            Fld[ii][jj] = 0;
    }
    if (IsStart0) Start0 = true;
    else Start0 = false;
    MoveCount = 0;
    MaxMoveCount = 0;
    RefreshScreen();
    WritePot(true);
    IsOver = false;
    if ((MoveCount + Start0) % 2 == 0) window.document.OptionsForm.Msg.value = " Blue to move.";
    else window.document.OptionsForm.Msg.value = " Red to move.";
}
//设置模式（人机对战与否）
function SetOption(nn, mm) {
    if (IsRunning) {
        LastEvent = "SetOption(" + nn + "," + mm + ")";
        return;
    }
    if (nn < 2) {
        if (mm == 0)
            IsPlayer[nn] = true;
        else
            IsPlayer[nn] = false;
    } else IsStart0 = mm;
}
//设置等级
function SetLevel(nn, mm) {
    if (IsRunning) {
        LastEvent = "SetLevel(" + nn + "," + mm + ")";
        return;
    }
    Level[nn] = mm;
}

var IsAI = 0;
//已不用
//设置是否显示ai状态图
function ShowAI(bb) {
    var ww;
    IsAI = bb;
    if (IsAI) {
        WritePot(true);
        document.getElementById('AI').style.display = 'inline';
        ww = parseInt(window.top.innerWidth);
        if (ww < 840) window.top.resizeBy(840 - ww, 0);
    } else document.getElementById('AI').style.display = 'none';
}
//时间处理函数
function Timer() {
    if (LastEvent != "") {
        eval(LastEvent);
        LastEvent = "";
        return;
    }
    if (IsOver) return;
    if (IsRunning) return;
    if (IsPlayer[(MoveCount + Start0 + 1) % 2]) {
        WritePot(true);
        return;
    }
    IsRunning = true;
    var ll = Level[(MoveCount + Start0 + 1) % 2];
    if (SwapTest()) return;
    GetPot(ll);
    //    setTimeout("GetBestMove(" + eval(((MoveCount + 1 + Start0) % 2) * 2 - 1) + "," + ll + ")", 10);
    GetBestMove(((MoveCount + 1 + Start0) % 2) * 2 - 1, ll);
}
//悔棋
function Back() {
    if (IsRunning) {
        LastEvent = "Back()";
        return;
    }
    if (MoveCount > 0) {
        IsOver = false;
        MoveCount--;
        var ii = History[MoveCount][0];
        var jj = History[MoveCount][1];
        if ((MoveCount == 1) && (IsSwap)) {
            Fld[jj][ii] = 0;
            RefreshPic(jj, ii);
            Fld[ii][jj] = ((MoveCount + Start0) % 2) * 2 - 1;
            RefreshPic(ii, jj);
        } else {
            Fld[ii][jj] = 0;
            RefreshPic(ii, jj);
        }
        if (MoveCount < 10)
            window.document.OptionsForm.Moves.value = " " + eval(MoveCount) + " ";
        else
            window.document.OptionsForm.Moves.value = MoveCount;
        if ((MoveCount + Start0) % 2 == 0) window.document.OptionsForm.Msg.value = " Blue to move.";
        else window.document.OptionsForm.Msg.value = " Red to move.";
        WritePot(true);
    }
}
//重开
function Replay() {
    if (IsRunning) {
        LastEvent = "Replay()";
        return;
    }
    if (MoveCount < MaxMoveCount) {
        var ii = History[MoveCount][0];
        var jj = History[MoveCount][1];
        if (MoveCount < MaxMoveCount - 1) {
            MakeMove(ii, jj, false);
            WritePot(true);
        } else MakeMove(ii, jj, true);
    }
}
//获得移动的路径（即历史记录
function GetMoveList() {
    var ii, jj, nn, ss = "";
    for (nn = 0; nn < MaxMoveCount; nn++) {
        ii = History[nn][0];
        jj = History[nn][1];
        if (nn > 0) ss += " ";
        ss += String.fromCharCode(65 + jj) + eval(ii + 1);
    }
    window.document.OptionsForm.MoveList.value = ss;
}
//已不用
//申请移动的路径（即在对应的move list中填入位置信息来移动而不是点击界面
function ApplyMoveList() {
    if (IsRunning) {
        LastEvent = "ApplyMoveList()";
        return;
    }
    Init();
    var ii, jj, nn, ss = window.document.OptionsForm.MoveList.value;
    ss = ss.split(" ");
    for (nn = 0; nn < ss.length; nn++) {
        jj = ss[nn].charCodeAt(0) - 65;
        ii = parseInt(ss[nn].substr(1, 2)) - 1;
        if (isNaN(ii) || isNaN(jj) || (ii < 0) || (jj < 0) || (ii >= Size) || (jj >= Size)) return;
        if (nn < ss.length - 1) MakeMove(ii, jj, false);
        else MakeMove(ii, jj, true);
    }
}
//已不用
function SwapTest() {
    if (!window.document.OptionsForm.Swap.checked) return (false);
    var ii, jj;
    if (MoveCount == 0) {
        ii = random(4);
        jj = random(4 - ii);
        if (random(2) < 1) {
            ii = Size - 1 - ii;
            jj = Size - 1 - jj;
        }
        MakeMove(ii, jj, false);
        WritePot(true);
        IsRunning = false;
        return (true);
    }
    if (MoveCount == 1) {
        for (ii = 0; ii < Size; ii++) {
            for (jj = 0; jj < Size; jj++) {
                if (Fld[ii][jj] != 0) {
                    if ((ii + jj < 2) || (ii + jj > 2 * Size - 4)) return (false);
                    if ((ii + jj == 2) || (ii + jj == 2 * Size - 4)) {
                        if (random(2) < 1) return (false);
                    }
                    MakeMove(ii, jj, false);
                    WritePot(true);
                    IsRunning = false;
                    return (true);
                }
            }
        }
    }
    return (false);
}
//在对应的显示框中显示现在的对局状况
function MakeMove(ii, jj, oo) {
    var ccol, kk, iis = ii,
        jjs = jj;
    if (MoveCount == 1) {
        if (Fld[ii][jj] != 0) {
            Fld[ii][jj] = 0;
            RefreshPic(ii, jj);
            iis = jj;
            jjs = ii;
            IsSwap = 1;
        } else IsSwap = 0;
    }
    ccol = ((MoveCount + 1 + Start0) % 2) * 2 - 1;
    Fld[iis][jjs] = ccol;
    RefreshPic(iis, jjs);
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
    if (MoveCount < 10)
        window.document.OptionsForm.Moves.value = " " + eval(MoveCount) + " ";
    else
        window.document.OptionsForm.Moves.value = MoveCount;
    if ((MoveCount + Start0) % 2 == 0) window.document.OptionsForm.Msg.value = " Blue to move.";
    else window.document.OptionsForm.Msg.value = " Red to move.";
    if ((MoveCount == 2) && (IsSwap > 0))
        window.document.OptionsForm.Msg.value = " Swap." + window.document.OptionsForm.Msg.value;
    if (!oo) return;
    GetPot(0);
    //GetPot(2); ShowPot();
    WritePot(true);
    if (ccol < 0) {
        if ((Pot[ii][jj][2] > 0) || (Pot[ii][jj][3] > 0)) return;
        window.document.OptionsForm.Msg.value = " Red has won !";
        Blink(0);
    } else {
        if ((Pot[ii][jj][0] > 0) || (Pot[ii][jj][1] > 0)) return;
        window.document.OptionsForm.Msg.value = " Blue has won !";
        Blink(0);
    }
    IsOver = true;
}
//获得随机数
function random(nn) {
    return (Math.floor(Math.random() * 1000) % nn);
}
//已不用
function ShowPot() {
    var ii, jj;
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++)
            window.document.images[ImgNum[ii][jj]].title =
            Math.round(Pot[ii][jj][2]) + "\n" +
            Math.round(Pot[ii][jj][0]) + "|" +
            Math.round(Pot[ii][jj][1]) + "->" +
            Math.round(Pot[ii][jj][0] + Pot[ii][jj][1]) + "\n" +
            Math.round(Pot[ii][jj][3]) + "->" +
            Math.round(Pot[ii][jj][2] + Pot[ii][jj][3]) + "\n" +
            Math.round(Pot[ii][jj][0] + Pot[ii][jj][1] + Pot[ii][jj][2] + Pot[ii][jj][3]) + "\n" +
            Math.round(Bridge[ii][jj][2]) + "\n" +
            Math.round(Bridge[ii][jj][0]) + "|" +
            Math.round(Bridge[ii][jj][1]) + "->" +
            Math.round(Bridge[ii][jj][0] + Bridge[ii][jj][1]) + "\n" +
            Math.round(Bridge[ii][jj][3]) + "->" +
            Math.round(Bridge[ii][jj][2] + Bridge[ii][jj][3]) + "\n" +
            Math.round(Bridge[ii][jj][0] + Bridge[ii][jj][1] + Bridge[ii][jj][2] + Bridge[ii][jj][3]) + "\n" +
            Math.round(Pot[ii][jj][0] + Pot[ii][jj][1] + Pot[ii][jj][2] + Pot[ii][jj][3] -
                Bridge[ii][jj][0] - Bridge[ii][jj][1] - Bridge[ii][jj][2] - Bridge[ii][jj][3]);
    }
}
//红色颜色的处理，红色的十六进制码的后四位为0000
function RedPotCol(vv) {
    return ("#" + ToHex(vv) + "0000");
}
//蓝色颜色的处理
function BluePotCol(vv) {
    return ("#0000" + ToHex(vv));
}

function ToHex(vv) {
    var xx = 0,
        hh = "0123456789ABCDEF";
    if (vv > 0) xx = vv;
    var nn = Math.floor(255 / (1 + xx / 255));
    var nn = Math.floor(Math.log10(xx / 512 + 1) / Math.log10(4) * 255);
    nn = nn > 255 ? 255 : nn;
    nn = 255 - nn;
    return hh.charAt(Math.floor(nn / 16)) + hh.charAt(nn % 16);
}

//画ai图上的格子
function WritePot(bb) {
    var ii, jj;
    if (!IsAI) return;
    if (bb) GetPot(2);
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++) {
            window.document.getElementById("Pot0" + ii + jj).title = Math.round(Pot[ii][jj][0]);
            window.document.getElementById("Pot1" + ii + jj).title = Math.round(Pot[ii][jj][1]);
            window.document.getElementById("Pot2" + ii + jj).title = Math.round(Pot[ii][jj][2]);
            window.document.getElementById("Pot3" + ii + jj).title = Math.round(Pot[ii][jj][3]);
            window.document.getElementById("Pot0" + ii + jj).innerHTML = ToHex(Pot[ii][jj][0]);
            window.document.getElementById("Pot1" + ii + jj).innerHTML = ToHex(Pot[ii][jj][1]);
            window.document.getElementById("Pot2" + ii + jj).innerHTML = ToHex(Pot[ii][jj][2]);
            window.document.getElementById("Pot3" + ii + jj).innerHTML = ToHex(Pot[ii][jj][3]);
            window.document.getElementById("Pot0" + ii + jj).style.backgroundColor = BluePotCol(Pot[ii][jj][0]);
            window.document.getElementById("Pot1" + ii + jj).style.backgroundColor = BluePotCol(Pot[ii][jj][1]);
            window.document.getElementById("Pot2" + ii + jj).style.backgroundColor = RedPotCol(Pot[ii][jj][2]);
            window.document.getElementById("Pot3" + ii + jj).style.backgroundColor = RedPotCol(Pot[ii][jj][3]);

            window.document.getElementById("Pot4" + ii + jj).title = Math.round((Pot[ii][jj][0] + Pot[ii][jj][1]) / 2);
            window.document.getElementById("Pot5" + ii + jj).title = Math.round((Pot[ii][jj][2] + Pot[ii][jj][3]) / 2);
            window.document.getElementById("Pot4" + ii + jj).innerHTML = ToHex((Pot[ii][jj][0] + Pot[ii][jj][1]) / 2);
            window.document.getElementById("Pot5" + ii + jj).innerHTML = ToHex((Pot[ii][jj][2] + Pot[ii][jj][3]) / 2);
            window.document.getElementById("Pot4" + ii + jj).style.backgroundColor = BluePotCol((Pot[ii][jj][0] + Pot[ii][jj][1]) / 2);
            window.document.getElementById("Pot5" + ii + jj).style.backgroundColor = RedPotCol((Pot[ii][jj][2] + Pot[ii][jj][3]) / 2);
        }
    }
}

function sign(xx) {
    if (xx < 0) return (-1);
    if (xx > 0) return (1);
    return (0);
}
//ai最佳下一步棋位置的算法
//2中也有
function GetBestMove(theCol, theLevel) {
    var ii, jj, kk, ii_b, jj_b, ff = 0,
        ii_q = 0,
        jj_q = 0,
        cc, pp0, pp1;
    vv = new Array();
    if (MoveCount > 0) ff = 190 / (MoveCount * MoveCount);
    mm = 20000;
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++) {
            if (Fld[ii][jj] != 0) {
                ii_q += 2 * ii + 1 - Size;
                jj_q += 2 * jj + 1 - Size;
            }
        }
    }
    ii_q = sign(ii_q);
    jj_q = sign(jj_q);
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++) {
            if (Fld[ii][jj] == 0) {
                mmp = Math.random() * (49 - theLevel * 16);
                //                mmp = 0;
                mmp += (Math.abs(ii - 5) + Math.abs(jj - 5)) * ff;
                mmp += 8 * (ii_q * (ii - 5) + jj_q * (jj - 5)) / (MoveCount + 1);
                if (theLevel > 2) {
                    for (kk = 0; kk < 4; kk++)
                        mmp -= Bridge[ii][jj][kk];
                }
                pp0 = Pot[ii][jj][0] + Pot[ii][jj][1];
                pp1 = Pot[ii][jj][2] + Pot[ii][jj][3];
                mmp += pp0 + pp1;
                if ((pp0 <= 268) || (pp1 <= 268)) mmp -= 400; //140+128
                vv[ii * Size + jj] = mmp;
                if (mmp < mm) {
                    mm = mmp;
                    ii_b = ii;
                    jj_b = jj;
                }
            }
        }
    }
    if (theLevel > 2) {
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
                    } else {
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
    MakeMove(ii_b, jj_b, false);
    IsRunning = false;
    if (theCol < 0) {
        if ((Pot[ii_b][jj_b][2] > 140) || (Pot[ii_b][jj_b][3] > 140)) {
            GetPot(0);
            WritePot(false);
            return;
        }
        window.document.OptionsForm.Msg.value = " Red has won !";
        Blink(-2);
    } else {
        if ((Pot[ii_b][jj_b][0] > 140) || (Pot[ii_b][jj_b][1] > 140)) {
            GetPot(0);
            WritePot(false);
            return;
        }
        window.document.OptionsForm.Msg.value = " Blue has won !";
        Blink(-2);
    }
    IsOver = true;
}
//GetBestMove的辅助函数
function CanConnectFarBorder(nn, mm, cc) {
    var ii, jj;
    if (cc > 0) //blue
    {
        if (2 * mm < Size - 1) {
            for (ii = 0; ii < Size; ii++) {
                for (jj = 0; jj < mm; jj++) {
                    if ((jj - ii < mm - nn) && (ii + jj <= nn + mm) && (Fld[ii][jj] != 0)) return (2);
                }
            }
            if (Fld[nn - 1][mm] == -cc) return (0);
            if (Fld[nn - 1][mm - 1] == -cc) {
                if (GetFld(nn + 2, mm - 1) == -cc) return (0);
                return (-1);
            }
            if (GetFld(nn + 2, mm - 1) == -cc) return (-2);
        } else {
            for (ii = 0; ii < Size; ii++) {
                for (jj = Size - 1; jj > mm; jj--) {
                    if ((jj - ii > mm - nn) && (ii + jj >= nn + mm) && (Fld[ii][jj] != 0)) return (2);
                }
            }
            if (Fld[nn + 1][mm] == -cc) return (0);
            if (Fld[nn + 1][mm + 1] == -cc) {
                if (GetFld(nn - 2, mm + 1) == -cc) return (0);
                return (-1);
            }
            if (GetFld(nn - 2, mm + 1) == -cc) return (-2);
        }
    } else {
        if (2 * nn < Size - 1) {
            for (jj = 0; jj < Size; jj++) {
                for (ii = 0; ii < nn; ii++) {
                    if ((ii - jj < nn - mm) && (ii + jj <= nn + mm) && (Fld[ii][jj] != 0)) return (2);
                }
            }
            if (Fld[nn][mm - 1] == -cc) return (0);
            if (Fld[nn - 1][mm - 1] == -cc) {
                if (GetFld(nn - 1, mm + 2) == -cc) return (0);
                return (-1);
            }
            if (GetFld(nn - 1, mm + 2) == -cc) return (-2);
        } else {
            for (jj = 0; jj < Size; jj++) {
                for (ii = Size - 1; ii > nn; ii--) {
                    if ((ii - jj > nn - mm) && (ii + jj >= nn + mm) && (Fld[ii][jj] != 0)) return (2);
                }
            }
            if (Fld[nn][mm + 1] == -cc) return (0);
            if (Fld[nn + 1][mm + 1] == -cc) {
                if (GetFld(nn + 1, mm - 2) == -cc) return (0);
                return (-1);
            }
            if (GetFld(nn + 1, mm - 2) == -cc) return (-2);
        }
    }
    return (1);
}
//CanConnectFarBorder的辅助函数
function GetFld(ii, jj) {
    if (ii < 0) return (-1);
    if (jj < 0) return (1);
    if (ii >= Size) return (-1);
    if (jj >= Size) return (1);
    return (Fld[ii][jj]);
}
//判断当前状况，在MakeMove，GetBestMove中都有用到，辅助函数，通过setTimeout() 方法在指定的毫秒数后调用函数或计算表达式
//并对当前状况做一系列操作
function Blink(nn) {
    IsRunning = true;
    if (nn == -2) {
        setTimeout("Blink(-1)", 10);
        return;
    }
    if (nn == -1) {
        GetPot(0);
        WritePot(false);
        setTimeout("Blink(0)", 10);
        return;
    }
    if (nn == 14) {
        IsRunning = false;
        return;
    }
    var ii, jj, cc = (nn % 2) * (((MoveCount + Start0) % 2) * 2 - 1);
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++) {
            if ((Pot[ii][jj][0] + Pot[ii][jj][1] <= 0) || (Pot[ii][jj][2] + Pot[ii][jj][3] <= 0)) {
                Fld[ii][jj] = cc;
                RefreshPic(ii, jj);
            }
        }
    }
    setTimeout("Blink(" + eval(nn + 1) + ")", 200);
}
//通过当前选择的等级来让ai获取下一步的棋子，如果等级低则降低准确度
//变成FF(链接到边缘的点），pot[][]就会变成[20000,20000,0,1248]
//Bridge中只有Bridge[0]与其他不相同，其他在未落子时均一致，而当落子之后，Bridge[][0]|[1]均会变为0
function GetPot(llevel) {
    var ii, jj, kk, mm, mmp, nn, bb, dd = 128;
    //    ActiveColor = ((MoveCount + 1 + Start0) % 2) * 2 - 1;
    ActiveColor = WHO_RED === currentMove ? -1 : 1;
    //Fld我方落了子就是-1，电脑落了就是1,没落就是0
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++) {
            for (kk = 0; kk < 4; kk++) {
                Pot[ii][jj][kk] = 20000;
                //bridge（Array[11])1-9过程中暂时无大的变化，但是0和10对应位置的前两个数在上下两部分边存在棋子的时候，会置为0
                Bridge[ii][jj][kk] = 0;
            }
        }
    }
    //设置边缘默认路径长度
    //未落子设置为dd=128
    //如果是自己的棋子就设置为0 即连通(最短路径为0)
    //如果是别人的棋子就不设置默认为20000 即路径长度无穷大
    for (ii = 0; ii < Size; ii++) {
        if (Fld[ii][0] == 0) Pot[ii][0][0] = dd; //blue border
        else {
            if (Fld[ii][0] > 0) Pot[ii][0][0] = 0; //如果是自己的棋子 将其路径长度设置为0
        }
        if (Fld[ii][Size - 1] == 0) Pot[ii][Size - 1][1] = dd; //blue border
        else {
            if (Fld[ii][Size - 1] > 0) Pot[ii][Size - 1][1] = 0;
        }
    }
    for (jj = 0; jj < Size; jj++) {
        00
        if (Fld[0][jj] == 0) Pot[0][jj][2] = dd; //red border
        else {
            if (Fld[0][jj] < 0) Pot[0][jj][2] = 0;
        }
        if (Fld[Size - 1][jj] == 0) Pot[Size - 1][jj][3] = dd; //red border
        else {
            if (Fld[Size - 1][jj] < 0) Pot[Size - 1][jj][3] = 0;
        }
    }
    for (kk = 0; kk < 2; kk++) //blue potential
    {
        for (ii = 0; ii < Size; ii++) {
            for (jj = 0; jj < Size; jj++)
                Upd[ii][jj] = true;
        }
        nn = 0;
        do {
            nn++;
            bb = 0; //bb表示每次迭代修改过权值的落子点数
            //正向迭代 从左到右
            for (ii = 0; ii < Size; ii++) {
                for (jj = 0; jj < Size; jj++) {
                    if (Upd[ii][jj]) bb += SetPot(ii, jj, kk, 1, llevel);
                }
            }
            //逆向迭代 从右到左
            for (ii = Size - 1; ii >= 0; ii--) {
                for (jj = Size - 1; jj >= 0; jj--) {
                    if (Upd[ii][jj]) bb += SetPot(ii, jj, kk, 1, llevel);
                }
            }
        }
        while ((bb > 0) && (nn < 12));
        // 如果此次迭代未修改过权值 即表示权值计算结束，迭代结束
        //（未修改权值的情况为正向迭代与反向迭代结果一致）
        // 迭代次数不超过12次 
    }
    for (kk = 2; kk < 4; kk++) //red potential
    {
        for (ii = 0; ii < Size; ii++) {
            for (jj = 0; jj < Size; jj++)
                Upd[ii][jj] = true;
        }
        nn = 0;
        do {
            nn++;
            bb = 0;
            for (ii = 0; ii < Size; ii++) {
                for (jj = 0; jj < Size; jj++) {
                    if (Upd[ii][jj]) bb += SetPot(ii, jj, kk, -1, llevel);
                }
            }
            for (ii = Size - 1; ii >= 0; ii--) {
                for (jj = Size - 1; jj >= 0; jj--) {
                    if (Upd[ii][jj]) bb += SetPot(ii, jj, kk, -1, llevel);
                }
            }
        }
        while ((bb > 0) && (nn < 12));
    }
}

var vv = new Array(6); //从右下的棋子开始逆时针一圈的每个点到边缘的路径长度
var tt = new Array(6);

//计算最短路径存放到Pot中 
//20000表示无法连通并且（距离无穷大）
//30000表示没有这个顶点 （距离无穷大）在vv中使用
function SetPot(ii, jj, kk, cc, llevel) { //cc=1
    Upd[ii][jj] = false;
    Bridge[ii][jj][kk] = 0;
    if (Fld[ii][jj] == -cc) return (0); //如果是别人的棋直接返回，使用默认值20000 不进行最短路径计算
    var ll, mm, ddb = 0,
        nn, oo = 0,
        dd = 140, //dd为这个点为空的默认路径长度
        bb = 66;
    if (cc != ActiveColor) bb = 52;
    //vv array(121)
    //potval 没落子就返回权值
    //落了就是30000
    //c:加入相邻节点
    vv[0] = PotVal(ii + 1, jj, kk, cc); //从右下的落子点开始逆时针一圈 获取六个落子点到边缘的路径长度 存入vv
    vv[1] = PotVal(ii, jj + 1, kk, cc);
    vv[2] = PotVal(ii - 1, jj + 1, kk, cc);
    vv[3] = PotVal(ii - 1, jj, kk, cc);
    vv[4] = PotVal(ii, jj - 1, kk, cc);
    vv[5] = PotVal(ii + 1, jj - 1, kk, cc);
    for (ll = 0; ll < 6; ll++) {
        if ((vv[ll] >= 30000) && (vv[(ll + 2) % 6] >= 30000)) { //如果间隔一个棋子的pot权值大于等于30000（无法连通）
            if (vv[(ll + 1) % 6] < 0)
                ddb = +32;
            else
                vv[(ll + 1) % 6] += 128; //512;
        }
    }
    for (ll = 0; ll < 6; ll++) {
        if ((vv[ll] >= 30000) && (vv[(ll + 3) % 6] >= 30000)) { //如果对称的棋子的pot权值大于等于30000（无法连通）
            ddb += 30;
        }
    }
    mm = 30000;
    for (ll = 0; ll < 6; ll++) {
        if (vv[ll] < 0) {
            vv[ll] += 30000;
            tt[ll] = 10;
        } else
            tt[ll] = 1;
        if (mm > vv[ll])
            mm = vv[ll]; //mm为边缘点权值最小的值
    }
    nn = 0;
    for (ll = 0; ll < 6; ll++) {
        if (vv[ll] == mm) nn += tt[ll]; //nn为边缘权值最小的点的个数
    }
    if (llevel > 4) {
        Bridge[ii][jj][kk] = nn / 5;
        if ((nn >= 2) && (nn < 10)) {
            Bridge[ii][jj][kk] = bb + nn - 2;
            mm -= 32;
        }
        if (nn < 2) {
            oo = 30000;
            for (ll = 0; ll < 6; ll++) {
                if ((vv[ll] > mm) && (oo > vv[ll]))
                    oo = vv[ll];
            }
            if (oo <= mm + 104) {
                Bridge[ii][jj][kk] = bb - (oo - mm) / 4;
                mm -= 64;
            }
            mm += oo;
            mm /= 2;
        }
    }

    if ((ii > 0) && (ii < Size - 1) && (jj > 0) && (jj < Size - 1))
        Bridge[ii][jj][kk] += ddb;
    else
        Bridge[ii][jj][kk] -= 2;
    if (((ii == 0) || (ii == Size - 1)) && ((jj == 0) || (jj == Size - 1)))
        Bridge[ii][jj][kk] /= 2; // /=4
    if (Bridge[ii][jj][kk] > 68)
        Bridge[ii][jj][kk] = 68; //66

    //如果是自己落子 
    if (Fld[ii][jj] == cc) {
        //修改权值并返回
        if (mm < Pot[ii][jj][kk]) { //计算的小于当前的
            Pot[ii][jj][kk] = mm;
            //修改周围六个落子点的遍历标志为true 再次遍历
            SetUpd(ii + 1, jj, cc);
            SetUpd(ii, jj + 1, cc);
            SetUpd(ii - 1, jj + 1, cc);
            SetUpd(ii - 1, jj, cc);
            SetUpd(ii, jj - 1, cc);
            SetUpd(ii + 1, jj - 1, cc);
            //返回表示修改过遍历标志 需要再次迭代
            return (1);
        }
        return (0);
    }
    // 如果没有落子
    if (mm + dd < Pot[ii][jj][kk]) {
        //修改权值并返回
        Pot[ii][jj][kk] = mm + dd;
        SetUpd(ii + 1, jj, cc);
        SetUpd(ii, jj + 1, cc);
        SetUpd(ii - 1, jj + 1, cc);
        SetUpd(ii - 1, jj, cc);
        SetUpd(ii, jj - 1, cc);
        SetUpd(ii + 1, jj - 1, cc);
        return (1);
    }
    return (0);
}
//每个棋子位的权值
function PotVal(ii, jj, kk, cc) {
    if (ii < 0) return (30000);
    if (jj < 0) return (30000);
    if (ii >= Size) return (30000);
    if (jj >= Size) return (30000);
    if (Fld[ii][jj] == 0) return (Pot[ii][jj][kk]); //如果没有落子
    if (Fld[ii][jj] == -cc) return (30000); //如果对方落子
    return (Pot[ii][jj][kk] - 30000); //如果我方落子 直接为负值
}

function SetUpd(ii, jj, cc) {
    if (ii < 0) return;
    if (jj < 0) return;
    if (ii >= Size) return;
    if (jj >= Size) return;
    Upd[ii][jj] = true;
}
//处理点击事件，返回响应的数据
function Clicked(ii, jj) {
    if (IsOver) return;
    if (IsRunning) {
        LastEvent = "Clicked(" + ii + "," + jj + ")";
        return;
    }
    if (Fld[ii][jj] != 0) {
        if ((MoveCount == 1) && (window.document.OptionsForm.Swap.checked)) MakeMove(ii, jj, false);
        return;
    }
    if (!IsPlayer[(MoveCount + Start0 + 1) % 2]) return;
    MakeMove(ii, jj, true);
    window.document.OptionsForm.HelpButton.focus();
    window.document.OptionsForm.HelpButton.blur();
}
//当前状况发生改变（点击，悔棋..）之后更新棋盘
function RefreshPic(ii, jj) {
    window.document.images[ImgNum[ii][jj]].src = Pic[1 + Fld[ii][jj]].src;
    if (MoveCount < 10)
        window.document.OptionsForm.Moves.value = " " + eval(MoveCount) + " ";
    else
        window.document.OptionsForm.Moves.value = MoveCount;
}
//更新整个屏幕，在初始化的时候使用
function RefreshScreen() {
    for (ii = 0; ii < Size; ii++) {
        for (jj = 0; jj < Size; jj++)
            document.images[ImgNum[ii][jj]].src = Pic[1 + Fld[ii][jj]].src;
    }
    if (MoveCount < 10)
        window.document.OptionsForm.Moves.value = " " + eval(MoveCount) + " ";
    else
        window.document.OptionsForm.Moves.value = MoveCount;
}
//help按钮点击弹窗
function ShowHelp() {
    alert("Hex is a board game for two players. It was" +
        "\nindependently invented by Piet Hein in 1942" +
        "\nand John Nash in 1948 and became popular" +
        "\nafter 1950 under the name Hex." +
        "\nHex is most commonly played on a board with" +
        "\n11x11 cells, but it can also be played on a" +
        "\nboard of another size. The red player trys" +
        "\nto connect the two red borders with a chain" +
        "\nof red cells by coloring empty cells red," +
        "\nwhile the blue player trys the same with the" +
        "\nblue borders." +
        "\nThe game can never end with a draw:" +
        "\nWhen all cells have been colored, there must" +
        "\nexists either a red chain or a blue chain." +
        "\nThe player who moves first has a big advantage." +
        "\nIn order to compense this, there is often used" +
        "\nthe so-called 'swap rule': After the first move," +
        "\nthe second player is allowed to swap the sides." +
        "\nIn order to apply the swap rule click again on" +
        "\nthe cell which was selected in the first move." +
        "\nGood luck!");
}

function Resize() {
    //    if (navigator.appName == "Netscape") history.go(0);
}
