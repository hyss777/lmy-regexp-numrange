//======================================
//G
//======================================
var G={};
G.isString = function(obj) {return (obj != null) && Object.prototype.toString.call(obj) === '[object String]';};
G.isArray = function(obj) {return (obj != null) && Object.prototype.toString.call(obj) === '[object Array]';};
G.a=console.log.bind(console);
G.each=function(x, f){
  var idx=0;
  for(var i in x){
    var v=x[i];
    f(i, v, idx);
    idx+=1;
  };
};
G.UD=function(x, d){
  if(x===undefined){return d;}
  else{return x;}
};


//======================================
//sexp
//======================================
var S={};
S.cat=function(){
  var arg=Array.prototype.slice.call(arguments);
  return [
    'cat',
  ].concat(arg);
};
S.or=function(){
  var arg=Array.prototype.slice.call(arguments);
  return [
    'or',
  ].concat(arg);
};
S.render=function(s){
  if(!G.isArray(s)){
    if(s!=null){s=s.toString();}
    else{s='';}
  }
  if(G.isString(s)){return s;}

  var n=s[0];
  var r='';
  var sub=s.slice(1);

  if(n==='cat'){
    G.each(sub, function(k,v,idx){
      r+=S.render(v);
    });
  }else if(n==='or'){
    var rr=[];
    G.each(sub, function(k, v, i){
      rr.push(S.render(v));
    })

    if(rr.length>1){
      r+='('+rr.join('|')+')';
    }else if(rr.length===1){
      r+=rr[0];
    }else{
      r+='';
    }
  }else{
    throw new Error('strange S:'+s+', only ["cat"|"or", ...] is acceptable');
  }
  return r;
};

S.format=function(sexp){
  var r=JSON.stringify(sexp, null, ' ').replace(/\n\s+]/g, ']');
  return r;
}

var gtThanNumPtn=function(num, allowEq){
  allowEq=G.UD(allowEq, false);
  var numArr=num.toString().split('');
  var _t=[];
  for(var k in numArr){
    _t.push(parseInt(numArr[k]));
  }
  numArr=_t;
  var first=parseInt(numArr[0]);
  
  var branch=[];

  //前缀大于分支
  if(first<9-1){
    var s1='['+(first+1)+'-'+(9)+']';
    if(numArr.length>1){s1+='\\d{'+(numArr.length-1)+'}';}
    branch.push(s1);
  }else if(first==9-1){
    var s1='[9]';
    if(numArr.length>1){s1+='\\d{'+(numArr.length-1)+'}';}
    branch.push(s1);
  }else{
    //如first===9, 则不存在前缀大于分支
  }
  
  //前缀相同分支
  if(numArr.length>1){
    var nextNum=num.toString().replace(/^\d/, '');
    var _sub=gtThanNumPtn(nextNum, allowEq);
    var s2=S.cat(first, _sub);
    branch.push(s2);
  }else{
    if(allowEq){
      var s2=first;
      branch.push(s2);
    }
  }
  
  var r=S.or.apply(null, branch);
  G.a(S.format(r));
  return r;
  /*
  if(branch.length==0){
    //如first是9,且numArr.length==0, 且allowEq==false, 则可能永不匹配.
    return '%';
  }
  //前缀小于分支则无意义.
  return '('+branch.join('|')+')';
  */
};

var ltThanNumPtn=function(num, allowEq){
  allowEq=G.UD(allowEq, false);
  var numArr=num.toString().split('');
  var _t=[];
  for(var k in numArr){
    _t.push(parseInt(numArr[k]));
  }
  numArr=_t;
  var first=parseInt(numArr[0]);
  
  if(numArr.length===0){
    return '';
  }
  var branch=[];

  //前缀大于分支无意义

  //前缀相同分支
  if(numArr.length>1){
    var nextNum=num.toString().replace(/^\d/, '');
    var _sub=ltThanNumPtn(nextNum, allowEq);
    var s2=S.cat(first.toString(), _sub);
    branch.push(s2);
    //if(_sub!=='%'){
    //  var s2=first.toString()+_sub;
    //  //G.a(s2, '@@#', nextNum)
    //  branch.push(s2);
    //}
  }else{
    if(allowEq){
      var s2='['+first.toString()+']';
      branch.push(s2);
    }
  }
  //前缀小于分支.
  if(first>1){
    var s3='[0-'+(first-1)+']';
    if(numArr.length>1){s3+='\\d{'+(numArr.length-1)+'}';}
    branch.push(s3);
  }else if(first===1){
    var s3='[0]';
    if(numArr.length>1){s3+='\\d{'+(numArr.length-1)+'}';}
    branch.push(s3);
  }else{
    //如first是0, 不存在此分支
  }

  return S.or.apply(null, branch);
  /*
  if(branch.length==0){
    //如first是0,且numArr.length==0, 且allowEq==false, 则可能永不匹配.
    return '%';
  }
  return '('+branch.join('|')+')';
  */
};

var regRange=function(start, end, startEq, endEq){
  startEq=G.UD(startEq, true);
  endEq=G.UD(endEq, true);

  //Z\d5
  var s2num=function(s){
    var m=s.match(/Z(\d+)/i);
    return m[1];
  };
  
  var startNum=s2num(start);
  var endNum=s2num(end);
  
  if(!(parseInt(startNum)<=parseInt(endNum))){
    var t=endNum;
    endNum=startNum;
    startNum=t;
  }

  var _a1=startNum.toString().split('');
  var _a2=endNum.toString().split('');
  _a1=(new Array(_a2.length-_a1.length)).concat(_a1.slice());
  
  var xxx=function(_a){
    var r=[];
    var edge=_a.length;
    var i=0;
    while(i<edge){
      var v=_a[i];
      if(v===undefined){
        r.push("0");
      }else{
        r.push(v);
      }
      i+=1;
    }
    return r;
  };
  _a1=xxx(_a1);
  //G.a(_a1, _a2, '###')

  var commonPrefix='Z';
  var idx=0;
  var newStart=0;
  var idxEdge=_a1.length;
  while(idx<idxEdge){
    if(_a1[idx]!==_a2[idx]){
      break;
    }else{
      commonPrefix+=G.UD(_a1[idx], 0).toString();
      newStart=idx+1;
    }
    idx+=1;
  }
  _a1=_a1.slice(newStart);
  _a2=_a2.slice(newStart);

  G.a(commonPrefix, '((()))', newStart, _a1, _a2)
  
  if(_a1.length===0){
    if(!(startEq && endEq)){
      alert('您输入的模式开始和结束位置相同, 且不接受两端位置, 此种特殊情况不予以接受')
    }else{
      return commonPrefix;
    }
  }
  
  var first1=parseInt(_a1[0]);
  var first2=parseInt(_a2[0]);
  
  var branch=[];
  //和最小分支相同first值分支
  if(_a1.length>1){
    var _sub=gtThanNumPtn((_a1.slice(1).join('')), startEq);

    /*
    if(_sub!=='%'){
      var s=first1+_sub;
      branch.push(s);
    }*/
    var s=S.cat(first1, _sub);
    branch.push(s);

  }else{
    if(startEq){
      var s=first1
      branch.push(s);
    }
  }

  //前缀之间分支
  if(first2-first1>0 && 1){
    if(first2-first1>=3){
      var s='['+(first1+1)+'-'+(first2-1)+']';
    }else if(first2-first1==2){
      var s='['+(first1+1)+']';
    }

    if(first2-first1>=2){
      if(_a1.length>1){
        s+='\\d{'+(_a1.length-1)+'}';
      }
      branch.push(s);
    }
  }

  //和最大分支相同first值分支
  if(_a2.length>1 && 1){
    var _sub=ltThanNumPtn((_a2.slice(1).join('')), endEq);

    var s=S.cat(first2, _sub);
    branch.push(s);
    /*
    if(_sub!=='%'){
      var s=first2+_sub;
      branch.push(s);
    }*/
  }else if(1){
    if(endEq){
      var s=first2.toString()
      branch.push(s);
    }
  };

  //var r=commonPrefix+'('+branch.join('|')+')';
  //return r;
  
  var finalSexp=S.cat(commonPrefix, S.or.apply(null, branch));
  var finalSexpInfo=S.format(finalSexp);
  G.a(finalSexpInfo, '@@@')
  var r;
  r=S.render(finalSexp);
  r='^'+r+'$';
  return r;
};

0 && (function(){
  var ptn=new RegExp(regRange('z31000','z32000', true, true), 'i');
  G.a(ptn)
  G.a(ptn.test('z30999'))
  G.a(ptn.test('z31000'))
  G.a(ptn.test('z31001'))

  G.a(ptn.test('z31999'))
  G.a(ptn.test('z32000'))
  G.a(ptn.test('z32001'))
})();

$(function(){
  var $i1=$('.i1');
  var $i2=$('.i2');
  var $cal=$('.cal');
  var $test=$('.test');
  var $ptn=$('.ptn');
  var $testStr=$('.test-string');
  var $i1In=$('.i1-include');
  var $i2In=$('.i2-include');
  var $result=$('.result');
  var $testResult=$('.test-result');

  $cal.click(function(){
    var r=regRange($i1.val(), $i2.val(), $i1In.prop('checked'),  $i2In.prop('checked'));
    $ptn.val(r);
    $result.text(r);
  });
  $test.click(function(){
    var ptn=new RegExp($ptn.val(), 'i');
    var testStr=$testStr.val();
    if(ptn.test(testStr)){
      $testResult.text('匹配');
      var match=true;
    }else{
      $testResult.text('不匹配');
      var match=false;
    }
    //G.a('try to test! match:', match, 'ptn:'+ptn);
  })
  
  $i1In.change(function(){$cal.click();$test.click()});
  $i2In.change(function(){$cal.click();$test.click()});
  $i1.change(function(){$cal.click();});
  $i2.change(function(){$cal.click();});
  $testStr.change(function(){$test.click();});
  
  //自动化测试初始化;
  0 && (function(){
    $i1.val('z00123');
    $i2.val('z01456');
    $testStr.val('z00351');
    $cal.click();
    $test.click();
  })();
})

