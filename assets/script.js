'use strict';
const log= console.log;
Element.prototype.removeAllChildren= function() {
	for(;this.hasChildNodes();)
		this.removeChild(this.lastChild);
};
var visit;
window.onload= ()=>{
	const menu= document.querySelector('#menu');
	const page= document.querySelector("#page");
	const title= document.querySelector('#title');
	const content= document.querySelector('#content');
	const previewList= document.createElement('div');
	const loc= window.location.href.split('#');
	const createNode= (html)=>{
		const div= document.createElement('div');
		div.innerHTML= html;
		return div;
	};
	let pageMap= {};
	pageMap['home']= {
		title:createNode('Our Articles'),
		content:previewList
	};
	const setPage= (page)=>{
		page= page||'home';
		title.removeAllChildren();
		title.append(pageMap[page].title);
		content.removeAllChildren();
		content.append(pageMap[page].content);
	};
	visit= (page)=>{
		setPage(page);
		history.pushState(page,'',loc[0]+'#'+page);
	};
	window.onpopstate= (e)=>{ setPage(e.state); };
	previewList.id= 'article-list';
	const deepCopy= (json)=>JSON.parse(JSON.stringify(json));
	const processContent= (json)=>{
		const ret= json;
		['title','headline','content'].filter((x)=>x in json).map((key)=>{
			const div= createNode(json[key]);
			div.classList.add('flex-grow','column');
			ret[key]= div;
		});
		return ret;
	};
	const logo= document.querySelector('#header-logo');
	const homeButton= document.createElement('div');
	homeButton.innerHTML='Home';
	[logo,homeButton].forEach((x)=>{x.addEventListener('click',()=>{visit('home');});});
	menu.append(homeButton);
	const fetchInit= {
		method:'GET',
		headers:new Headers()
	};
	[['pragma','no-cache'],['cache-control','no-cache'],['cache-control','no-store']].map(([x,y])=>{fetchInit.headers.append(x,y);});
	// log('fetchInit:',fetchInit);
	Promise.all([
		fetch('articles.json',fetchInit)
			.then((resp)=>resp.json())
			.then((pages)=>Promise.all(pages.map((page)=>fetch('articles/'+page+'.json',fetchInit)
				.then((resp)=>resp.json())
				.then((json)=>{
					json=processContent(json);
					pageMap[page]= json;
					const preview= document.createElement('div');
					preview.classList.add('article-preview','clickable');
					preview.addEventListener('click',()=>{visit(page);});
					{
						const clone= json.title.cloneNode(true);
						clone.classList.add('preview-title');
						preview.append(clone);
					}
					if('img' in json) {
						// log('json has img');
						const img= document.createElement('img');
						img.src= json.img;
						img.classList.add('article-img');
						preview.append(img);
					}
					json.headline.classList.add('preview-headline');
					preview.append(json.headline);
					previewList.append(preview);
				})
			))),
		fetch('static.json',fetchInit)
			.then((resp)=>resp.json())
			.then((staticPages)=>Promise.all(staticPages.map(([buttonLabel,res,...args])=>fetch('static/'+res+'.json',fetchInit)
				.then((resp)=>resp.json())
				.then((json)=>{
					json= processContent(json);
					if (args.includes("hide")) {
						pageMap[buttonLabel] = json;
					} else {
						pageMap[res]= json;
						const button= document.createElement('div');
						button.addEventListener('click',()=>{visit(res);});
						button.innerHTML= buttonLabel;
						menu.append(button);
					}
				})
			)))
	]).then(()=>{
		setPage(loc[1]);
	});
}
function scrollToNoMenu(query) {
	window.scrollTo(0,document.querySelector(query).getBoundingClientRect().y - document.querySelector('#menu').getBoundingClientRect().height);
}
