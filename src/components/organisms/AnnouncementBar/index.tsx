import React, { useEffect, useState } from 'react';
import { useSlider } from './hooks';
import { Link, Stack, TP } from '../../atoms';
import styled from '@emotion/styled';

type AnnouncementBarType = {
    message: string;
    href: string;
    bgColor: string;
    textColor: string;
    hoverTextColor: string;
    hoverBgColor: string;
};

type Omitted = Omit<Omit<AnnouncementBarType, 'message'>, 'href'>;
export const AnnouncementBar: React.FC<{ entries: AnnouncementBarType[]; secondsBetween: number }> = ({
    entries,
    secondsBetween,
}) => {
    const [jsEnabled, setJsEnabled] = useState(false);
    const { ref } = useSlider({ secondsBetween });

    useEffect(() => {
        setJsEnabled(true);
    }, []);

    return (
        <Stack w100>
            {jsEnabled ? (
                <Stack w100 className="keen-slider" ref={ref}>
                    {entries.map((bar, idx) => {
                        const { message, href, ...styles } = bar;
                        return (
                            <Link key={idx} href={href}>
                                <Entry {...styles} justifyCenter itemsCenter w100 className="keen-slider__slide">
                                    <TP size="1.25rem" weight={600}>
                                        {message}
                                    </TP>
                                </Entry>
                            </Link>
                        );
                    })}
                </Stack>
            ) : (
                <Stack w100>
                    <Link href={entries[0].href} style={{ width: '100%' }}>
                        <Entry {...entries[0]} justifyCenter itemsCenter w100>
                            <TP size="1.25rem" weight={600}>
                                {entries[0].message}
                            </TP>
                        </Entry>
                    </Link>
                </Stack>
            )}
        </Stack>
    );
};
const Entry = styled(Stack)<Omitted>`
    padding: 1rem 0;
    background: ${p => p.bgColor};
    color: ${p => p.textColor};
    cursor: pointer;
    transition:
        background 0.4s ease-out,
        color 0.4s ease-out;
    &:hover {
        background: ${p => p.hoverBgColor};
        color: ${p => p.hoverTextColor};
    }
`;