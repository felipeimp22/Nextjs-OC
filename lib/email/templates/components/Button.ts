export interface ButtonProps {
  url: string;
  text: string;
  color?: string;
}

export function Button({ url, text, color = '#f03e42' }: ButtonProps): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}"
         style="display: inline-block;
                padding: 14px 32px;
                background-color: ${color};
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;">
        ${text}
      </a>
    </div>
  `;
}
