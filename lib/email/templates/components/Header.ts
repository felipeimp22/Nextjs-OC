export interface HeaderProps {
  title: string;
  emoji?: string;
}

export function Header({ title, emoji }: HeaderProps): string {
  return `
    <div class="header">
      <h1>${emoji ? emoji + ' ' : ''}${title}</h1>
    </div>
  `;
}
