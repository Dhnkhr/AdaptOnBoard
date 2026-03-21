import requests
import re

def parse_github_profile(url: str) -> str:
    """
    Takes a GitHub URL, hits the public API, and generates a massive text string
    acting as a "Resume" containing their repos, languages, and descriptions.
    """
    match = re.search(r'github\.com/([^/]+)', url)
    if not match:
        raise ValueError("Invalid GitHub URL. Must contain 'github.com/username'")
    
    username = match.group(1).split("?")[0]
    
    try:
        # Fetch repos sorted by recently pushed
        resp = requests.get(f"https://api.github.com/users/{username}/repos?sort=pushed&per_page=15", timeout=10)
        resp.raise_for_status()
        repos = resp.json()
        
        if not repos:
            return f"User {username} has no public repositories on GitHub."
            
        portfolio_text = f"Candidate GitHub Profile: {username}\n\n"
        portfolio_text += "### Projects & Repositories ###\n\n"
        
        for repo in repos:
            if not repo.get("fork"): # Skip forked repos to ensure original skills
                portfolio_text += f"Project: {repo.get('name')}\n"
                if repo.get('description'):
                    portfolio_text += f"Description: {repo.get('description')}\n"
                if repo.get('language'):
                    portfolio_text += f"Primary Technical Language: {repo.get('language')}\n"
                if repo.get('topics'):
                    portfolio_text += f"Topics / Frameworks: {', '.join(repo.get('topics'))}\n"
                portfolio_text += "\n"
                
        return portfolio_text
    except Exception as e:
        raise ValueError(f"Failed to fetch GitHub data for {username}: {str(e)}")
