// 进度条
var progessBox = document.getElementsByClassName('progess-box')[0]
var soundBox = document.getElementsByClassName('sound-box')[0]

// 进度条移动
function progessmove(elem, num) {
	if (elem == progessBox) {
		num = num - elem.offsetLeft - 56
		if (num > 1000) num = 1000
	} else {
		num = num - elem.offsetLeft - 60
		if (num > 100) num = 100
	}
	elem.children[0].style.width = num + 'px'
	elem.children[1].style.left = elem.children[0].style.width
}
// 进度条拖拽
progessBox.children[1].onmousedown = function () {
	var th = this
	con = 1
	document.onmousemove = function () {
		dtime = parseInt(progessBox.children[0].style.width) / parseInt(progessBox.offsetWidth) * music.duration
		progessmove(th.parentElement, event.clientX)
	}
}
document.onmouseup = function () {
	if(con)music.currentTime = dtime
	document.onmousemove = null
	con = 0
}
// 进度条点击
progessBox.onclick = function () {
	progessmove(progessBox, event.clientX)
	music.currentTime = parseInt(progessBox.children[0].style.width) / parseInt(progessBox.offsetWidth) * music.duration
}

// 音量条拖拽
soundBox.children[1].onmousedown = function () {
	var th = this
	document.onmousemove = function () {
		progessmove(th.parentElement, event.clientX)
		music.volume = parseInt(soundBox.children[0].style.width) / 100
	}
}
// 音量条点击
soundBox.onclick = function () {
	progessmove(soundBox, event.clientX)
	music.volume = parseInt(soundBox.children[0].style.width) / 100
}


// 歌曲控制, 播放, 暂停 .........
var bf = document.getElementsByClassName('footer-song-bf')[0]
var music = document.getElementsByTagName('audio')[0]
var con = 0 				//con判断是否在拖动进度条
bf.playing = 0			//当前的播放状态
bf.onclick = function () {
	if (this.playing) {
		this.playing = 0
		this.classList.remove('icon-bofangzanting')
		this.classList.add('icon-bofang')
		music.pause()
	} else {
		this.playing = 1
		this.classList.remove('icon-bofang')
		this.classList.add('icon-bofangzanting')
		music.play()
	}
}

// 歌曲进度条同步
var dtime
var footer_dtime = document.getElementsByClassName('dtime')[0]
music.addEventListener('timeupdate', function () {
	if (con) return
	progessBox.children[0].style.width = music.currentTime / music.duration * 100 + '%'
	progessBox.children[1].style.left = progessBox.children[0].style.width
	footer_dtime.innerHTML = `${(music.currentTime/60).toFixed(0)}:${(music.currentTime%60).toFixed(0)}`
})


// 包装http请求, GET类型
function httpget(url) {
	const request = new XMLHttpRequest()
	request.open('GET', url, true)
	request.send()
	function then(res) {
		request.onreadystatechange = function () {
			if (request.readyState == 4) {
				if (request.status >= 200 && request.status < 300) {
					res(JSON.parse(request.response))
				} else return console.log('http请求出错');
			}
		}
	}
	return { then }

}

// 创建修改songlist, mvlist时setter
var song = {}
var doc = document.getElementsByTagName('tbody')[0]
doc.onclick = function () {
	// 事件代理, 处理 menu 中的播放和下载按钮
	var lyric
	var rid = event.target.parentElement.parentElement.parentElement.rid
	var pic = event.target.parentElement.parentElement.parentElement.pic
	var songname = event.target.parentElement.parentElement.children[0].innerHTML
	var singer = event.target.parentElement.parentElement.parentElement.children[1].innerHTML
	var time = event.target.parentElement.parentElement.parentElement.children[2].innerHTML
	if (event.target.classList[1] == 'icon-bofang') {
		httpget(`http://127.0.0.1:7002/kuwo/url?rid=${rid}`).then(respon => {
			// 请求到song url后修改播放链接, footer相关样式
			music.src = respon.url
			// 修改底部
			// 修改播放按钮样式
			bf.playing = 0
			bf.classList.remove('icon-bofangzanting')
			bf.classList.add('icon-bofang')
			// 修改歌名和歌手
			document.getElementsByClassName('footer-song-name')[0].innerHTML = songname
			document.getElementsByClassName('footer-song-author')[0].innerHTML = singer
			// 修改时间
			time = parseInt(time)
			time = `${(time/60).toFixed(0)}:${time%60}`
			document.getElementsByClassName('ztime')[0].innerHTML = time
			// 修改右侧图片,歌词
			document.getElementsByClassName('song-detail-img')[0].src = pic
		})
		httpget(`http://127.0.0.1:7002/kuwo/lrc?musicId=${rid}`).then(respon =>{
			lyric = respon.data.lrclist
			for(let i=0; i<lyric.length; i++){
				let p = document.createElement('p')
				p.innerHTML = lyric[i].lineLyric
				document.getElementById('lyric').appendChild(p)
			}

		})
	}else{
		httpget(`http://127.0.0.1:7002/kuwo/url?rid=${rid}`).then(respon => {
			window.open(respon.url)
		})
	}
}
Object.defineProperty(song, 'songlist', {
	enumerable: true,
	set: function (newval) {
		songlist = newval
		doc.innerHTML = ' '
		for (let i = 0; i < songlist.length; i++) {
			let tr = document.createElement('tr')
			tr.rid = songlist[i].rid
			tr.pic = songlist[i].pic
			tr.innerHTML = `
				<td class="list-name">
					<span>${songlist[i].name}</span>
					<div class="list-name-menu">
							<span class="iconfont icon-bofang"></span>
							<span class="iconfont icon-xiazai"></span>
					</div>
				</td>
				<td class="list-author">${songlist[i].artist}</td>
				<td class="list-time">${songlist[i].duration}秒</td>`
			doc.appendChild(tr)
		}
	}
})
// 定义搜索事件
var search = document.getElementById('search')
search.onkeydown = function () {
	if (event.keyCode != 13) return
	httpget(`http://127.0.0.1:7002/kuwo/search/searchMusicBykeyWord?key=${search.value}`).then(respon => {
		song.songlist = respon.data.list
		listToEnd = 1
	})
}
var list = document.getElementsByClassName('list')[0]
var listToEnd = 0+1
list.addEventListener('scroll',()=>{
	if(list.scrollHeight - list.scrollTop == list.clientHeight){
		httpget(`http://127.0.0.1:7002/kuwo/search/searchMusicBykeyWord?key=${search.value}&pn=${++listToEnd}`).then(respon => {
			song.songlist = respon.data.list
			list.scrollTop = 0
		})
	}
})