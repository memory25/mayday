var newScript = document.createElement('script');
newScript.setAttribute('src', 'https://tixcraft.com/js/jquery.scrollchaser.js')
document.head.appendChild(newScript);

jQuery(document).on('click', '#yw0', function(){
	jQuery.ajax({
		url: "\/ticket\/captcha?refresh=1",
		dataType: 'json',
		cache: false,
		success: function(data) {
			jQuery('#yw0').attr('src', data['url']);
			jQuery('body').data('captcha.hash', [data['hash1'], data['hash2']]);
		}
	});
	return false;
});

function invoke(url){
  return fetch(url)
    .then((res)=> res.text())
}

function runScript(script){
  const newScript = document.createElement('script');
  newScript.innerHTML = script.innerHTML;

  document.head.appendChild(newScript);
}

function order_check(){
  return true
}

function ravenConfig(){}


async function isTestPage(){
  const checkTestPage = await invoke(testUrl);

  return !!checkTestPage.match('測試')
}

async function PreCheckPage(){
  const preCheckPage = await invoke(targetUrl);
  document.querySelector('body').outerHTML = preCheckPage;
  document.head.remove();

  return [...document.querySelectorAll('#gameList tbody tr td:first-of-type')].some((td)=>{
    if(td.textContent.match(date) && td.parentNode.querySelector('input')){
      newlink = origin + td.parentNode.querySelector('input').dataset.href;
      return true;
    }
    return false;
  })
}

async function ChooseSeatPage(count=0){
  if(count === retryTimes) return null;
  const chooseSeatPage = await invoke(newlink)
  document.querySelector('body').outerHTML = chooseSeatPage;
  document.head.remove();
  const div = document.querySelector('.showTryTimes') || document.createElement('div');
  div.textContent = `重試 ${count} 次`;
  div.className = 'showTryTimes';
  div.style.position = 'absolute';
  div.style.top = 0;
  div.style.left = 0;
  div.style.background = 'red';
  div.style.zIndex = 999999999;
  div.style.fontSize = '20px';
  document.querySelector('html').appendChild(div);
  
  runScript([...document.querySelectorAll('script')].reverse()[0]);

  let haveSeat = [...document.querySelectorAll('ul.area-list a')].some((a)=>{
    return areaList.some((area)=>{
      if(a.textContent.match(area)){
        newlink  = origin  + areaUrlList[a.id]
        return true;
      }
      return false;
    })
  });
  
  if(!haveSeat){
    haveSeat = [...document.querySelectorAll('ul.area-list a')].some(a=> {
      newlink  = origin  + areaUrlList[a.id];
      return true;
    })
  }
  
  
  // if no seat, keep loop
  if(!haveSeat){
    await ChooseSeatPage(count+1)
  }
}

async function ChooseTicketNumPage(){
  const chooseTicketNumPage = await invoke(newlink)
  document.querySelector('body').outerHTML = chooseTicketNumPage;
  document.head.remove();
  
  runScript([...[...document.querySelectorAll('head')].reverse()[0].querySelectorAll('script')].reverse()[0]);
  
  const form = document.querySelector('#TicketForm')
  document.body.innerHTML = ''
  document.body.append(form)
  
  document.querySelector('.btn-reselect').remove();
  document.querySelector('.btn-check').disabled = true
  
  const agreeNode = document.querySelector('#TicketForm_agree').parentNode;
  agreeNode.style.position = 'fixed';
  agreeNode.style.top = 0;
  agreeNode.style.left = 0;
  agreeNode.style.background = 'transparent';
  agreeNode.style.width = '100vw';
  agreeNode.style.height = '100vh';
  agreeNode.style.zIndex = 99999;
  agreeNode.style.opacity = 0;
  document.querySelector('#TicketForm_agree').addEventListener('change', ()=>{
    document.querySelector('.btn-check').disabled = false;
    document.querySelector('#TicketForm_agree').checked = true;
    agreeNode.style.display = 'none';
    document.querySelector('#TicketForm_verifyCode').focus()
  })
  
  document.querySelector('#TicketForm').action = newlink;
  //document.querySelector('#TicketForm select').value = document.querySelectorAll('#TicketForm select option').length - 1;
  document.querySelector('#TicketForm select').value = ticketNum;   
  document.querySelector('#TicketForm_agree').checked = true;
}


var testCount = 0;
async function hijack(){
  let isTesting = true;
  let isPreCheckPage = true;

  while(isTesting){
    testCount++;
    console.log(testCount);
    isTesting = await isTestPage()
  }

  while(isPreCheckPage){
    isPreCheckPage = !(await PreCheckPage())
  }

  await ChooseSeatPage()

  await ChooseTicketNumPage()
}